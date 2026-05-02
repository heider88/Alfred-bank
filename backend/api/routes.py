from uuid import UUID
import json
import os
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from core.database import get_db
from schemas.pydantic_schemas import (
    AccountCreate, 
    AccountResponse, 
    AccountNameResponse,
    FundPayload, 
    TransferPayload, 
    StatementResponse,
    TransactionResponse,
    ChatRequest,
    ChatResponse,
    PocketCreate,
    PocketFund,
    PocketResponse
)

from services.transaction_service import execute_transfer
from services.account_service import create_account, fund_account, get_account_statement
from services.pocket_service import create_pocket, get_pockets, fund_pocket, update_pocket

from api.dependencies import get_current_user
from models.domain import Account
from langchain_core.messages import ToolMessage, AIMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool


router = APIRouter(tags=["Fintech API"])

@router.get("/accounts/me", response_model=AccountResponse)
async def read_users_me(current_user: Account = Depends(get_current_user)):
    """Obtiene la información de la cuenta autenticada."""
    return current_user

@router.post("/accounts/", response_model=AccountResponse, status_code=201)
async def create_new_account(
    payload: AccountCreate, 
    db: AsyncSession = Depends(get_db)
):
    """Crea una nueva cuenta bancaria con saldo inicial en 0."""
    return await create_account(db, payload.owner_name, payload.email, payload.password)


@router.post("/accounts/{account_id}/fund", response_model=AccountResponse)
async def add_funds(
    account_id: str, 
    payload: FundPayload, 
    db: AsyncSession = Depends(get_db)
):
    """Simula la recarga de saldo a una cuenta existente (Ingreso de capital)."""
    return await fund_account(db, account_id, payload.amount_cents)


@router.post("/transactions/transfer", response_model=TransactionResponse)
async def transfer_funds(
    payload: TransferPayload, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Realiza una transferencia segura entre dos cuentas.
    Solo permite si la cuenta origen pertenece al usuario autenticado.
    """
    if payload.from_account_id != current_user.id:
         raise HTTPException(status_code=403, detail="No tienes permisos para transferir desde esta cuenta")

    return await execute_transfer(
        db=db,
        from_account_id=payload.from_account_id,
        to_account_id=payload.to_account_id,
        amount_cents=payload.amount_cents,
        description=payload.description
    )


@router.get("/accounts/{account_id}/statement", response_model=StatementResponse)
async def get_statement(
    account_id: str, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Obtiene el estado de cuenta de un usuario.
    Solo permite obtener si el account_id pertenece al usuario autenticado.
    """
    if account_id != current_user.id:
         raise HTTPException(status_code=403, detail="Acceso denegado a esta cuenta")

    return await get_account_statement(db, account_id)

@router.get("/accounts/resolve/{identifier}")
async def resolve_account(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    from sqlalchemy import select

    # Determinar si el identificador es un email o un ID corto
    if "@" in identifier:
        stmt = select(Account).where(Account.email == identifier)
    else:
        stmt = select(Account).where(Account.id == identifier)

    result = await db.execute(stmt)
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta destino no encontrada. Verifica el ID o correo.")
        
    if account.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes transferir a tu propia cuenta aquí.")

    return {
        "account_id": account.id,
        "owner_name": account.owner_name,
        "email": account.email
    }

@router.get("/accounts/{account_id}/name", response_model=AccountNameResponse)
async def get_account_name(
    account_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    from sqlalchemy import select
    stmt = select(Account.owner_name).where(Account.id == account_id)
    result = await db.execute(stmt)
    owner_name = result.scalar_one_or_none()
    
    if not owner_name:
        raise HTTPException(status_code=404, detail="Cuenta destino no encontrada")
        
    return {"owner_name": owner_name}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_alfred(
    payload: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    try:
        if payload.account_id != current_user.id:
            raise HTTPException(status_code=403, detail="Acceso denegado al contexto de esta cuenta")
        
        # 1. Obtener estado de cuenta
        statement = await get_account_statement(db, payload.account_id)
        balance_cop = f"${statement['balance_cents'] / 100:,.2f} COP"
        
        # 2. Formatear últimas transacciones
        transactions = statement['transactions'][:5]
        if not transactions:
            tx_history = "Sin movimientos recientes"
        else:
            tx_lines = []
            for tx in transactions:
                # Determinar si es ingreso o egreso comparando to_account_id con account_id
                is_deposit = (tx["to_account_id"] == payload.account_id) and (tx["from_account_id"] != payload.account_id)
                sign = "+" if is_deposit else "-"
                amount = f"${tx['amount_cents'] / 100:,.2f} COP"
                date_str = tx['timestamp'].strftime("%Y-%m-%d %H:%M") if tx.get('timestamp') else "N/A"
                desc = tx.get("description", "Movimiento") or "Movimiento"
                counterparty = tx.get("counterparty_name", "Externo")
                tx_lines.append(f"- {date_str}: {sign}{amount} ({desc} - Contraparte: {counterparty})")
            tx_history = "\n".join(tx_lines)
            
        # 3. Formatear bolsillos
        pockets = await get_pockets(db, payload.account_id)
        if not pockets:
            pockets_summary = "El usuario no tiene bolsillos de ahorro creados."
        else:
            pocket_lines = []
            for p in pockets:
                bal = f"${p.balance_cents / 100:,.2f} COP"
                if p.goal_cents:
                    goal = f"${p.goal_cents / 100:,.2f} COP"
                    pct = min(100, int((p.balance_cents / p.goal_cents) * 100))
                    pocket_lines.append(f"- {p.name}: {bal} (Meta: {goal} - Progreso: {pct}%)")
                else:
                    pocket_lines.append(f"- {p.name}: {bal} (Sin meta definida)")
            pockets_summary = "\n".join(pocket_lines)
            
        # 4. Configurar LangChain
        api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            from dotenv import load_dotenv
            load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
            api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
            
        if not api_key:
            raise HTTPException(status_code=500, detail="API Key de Gemini no configurada en el servidor.")
            
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2, google_api_key=api_key, max_retries=1)
        
        @tool
        def crear_bolsillo_y_transferir(nombre_bolsillo: str, monto_inicial: float, meta_ahorro: float = None) -> str:
            """Crea un bolsillo de ahorro y opcionalmente le transfiere un monto inicial.
            
            Args:
                nombre_bolsillo: Nombre del bolsillo o meta de ahorro (ej. "Vacaciones", "Viaje").
                monto_inicial: Cantidad de dinero a transferir al bolsillo en COP.
                meta_ahorro: (Opcional) Meta total a ahorrar en COP.
            """
            pass
            
        llm_with_tools = llm.bind_tools([crear_bolsillo_y_transferir])
        
        system_template = """Eres Alfred, el asesor financiero inteligente de Alfred Bank.
Contexto financiero en tiempo real del usuario:

Saldo Actual Disponible: {current_balance}

Bolsillos de Ahorro:
{pockets_info}

Últimos Movimientos:
{transaction_history}

Tus Reglas:
Eres directo, minimalista y sofisticado. Tono de mayordomo moderno.
Solo hablas de finanzas y del contexto proporcionado.
Si el saldo es bajo, sugiere moderar gastos elegantemente.

MUY IMPORTANTE SOBRE LOS BOLSILLOS:
- Tienes la capacidad real de crear bolsillos en el sistema.
- Si el usuario te pide crear un bolsillo o ahorrar para una meta (ej: "crea un bolsillo", "ahorra $50000 para X"), DEBES usar OBLIGATORIAMENTE la herramienta 'crear_bolsillo_y_transferir'. NO te disculpes diciendo que no puedes hacerlo.
- Si invocas la herramienta, espera el resultado y luego respóndele al usuario con elegancia confirmando la creación y su nuevo saldo disponible.

Responde SIEMPRE en formato Markdown limpio, usando negritas para el dinero."""
        
        system_content = system_template.format(
            current_balance=balance_cop,
            transaction_history=tx_history,
            pockets_info=pockets_summary
        )
        
        messages = [SystemMessage(content=system_content)]
        
        # Agregamos el historial de la conversación previa
        for msg in payload.history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "alfred":
                messages.append(AIMessage(content=msg.content))
                
        # Agregamos la pregunta actual
        messages.append(HumanMessage(content=payload.message))
        
        # 5. Ejecutar cadena principal
        response = await llm_with_tools.ainvoke(messages)
        messages.append(response)
        
        if response.tool_calls:
            for tool_call in response.tool_calls:
                if tool_call["name"] == "crear_bolsillo_y_transferir":
                    monto = tool_call["args"].get("monto_inicial", 0)
                    nombre = tool_call["args"].get("nombre_bolsillo", "Ahorro")
                    meta = tool_call["args"].get("meta_ahorro")
                    
                    try:
                        monto_cents = int(float(monto) * 100)
                    except (ValueError, TypeError):
                        monto_cents = 0
                        
                    try:
                        meta_cents = int(float(meta) * 100) if meta else None
                    except (ValueError, TypeError):
                        meta_cents = None
                        
                    try:
                        new_pocket = await create_pocket(db, payload.account_id, nombre, meta_cents)
                        if monto_cents > 0:
                            await fund_pocket(db, payload.account_id, new_pocket.id, monto_cents)
                            tool_msg = f"Bolsillo '{nombre}' creado y fondeado exitosamente con ${float(monto):,.2f} COP."
                        else:
                            tool_msg = f"Bolsillo '{nombre}' creado exitosamente sin fondos iniciales."
                    except Exception as e:
                        tool_msg = f"Error al crear el bolsillo: {str(e)}"
                        
                    messages.append(ToolMessage(content=tool_msg, tool_call_id=tool_call["id"]))
            
            # Segunda llamada para que el modelo redacte el mensaje final basado en la rta de la tool
            response = await llm_with_tools.ainvoke(messages)
            
        # Parseo seguro del output del modelo (puede ser lista o string)
        reply_content = response.content
        if isinstance(reply_content, list):
            reply_text = "".join(
                [block.get("text", "") for block in reply_content if isinstance(block, dict) and block.get("type") == "text"]
            )
            if not reply_text:
                reply_text = str(reply_content)
        else:
            reply_text = str(reply_content)
            
        return ChatResponse(reply=reply_text)
        
    except ValueError as e:
        import traceback
        traceback.print_exc()
        if "Cuenta no encontrada" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=500, detail=f"Error interno (ValueError): {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error interno del servidor de chat: {str(e)}")

@router.post("/ocr/receipt")
async def ocr_receipt(
    file: UploadFile = File(...),
    current_user: Account = Depends(get_current_user)
):
    try:
        image_bytes = await file.read()
        
        # Usamos google-generativeai directamente para este OCR
        api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            from dotenv import load_dotenv
            load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
            api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
            
        if not api_key:
             raise ValueError("API Key de Gemini no configurada")
             
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = 'Eres un sistema OCR financiero. Analiza este recibo y extrae los productos y sus precios. Si hay varias cantidades de un mismo producto en una línea (ej: "2x Hamburguesa"), el precio debe ser el TOTAL de esa línea. Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta, sin texto adicional ni bloques markdown: {"items": [{"name": "nombre", "price": 0.0}], "subtotal": 0.0, "tax": 0.0, "total": 0.0}'
        
        # Preparamos el bloque de imagen
        image_part = {
            "mime_type": file.content_type or "image/jpeg",
            "data": image_bytes
        }
        
        response = await model.generate_content_async([prompt, image_part])
        
        # Limpiamos el texto por si incluye tags de markdown
        text = response.text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(text)
    except Exception as e:
        print(f"Error procesando OCR: {str(e)}")
        raise HTTPException(status_code=500, detail="Error procesando la imagen de la factura. Por favor, intenta de nuevo.")

# --- Pocket Routes ---

from typing import List

@router.post("/pockets", response_model=PocketResponse, status_code=201)
async def api_create_pocket(
    payload: PocketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """Crea un nuevo bolsillo de ahorro."""
    return await create_pocket(db, current_user.id, payload.name, payload.goal_cents)

@router.get("/pockets", response_model=List[PocketResponse])
async def api_get_pockets(
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """Obtiene todos los bolsillos del usuario."""
    return await get_pockets(db, current_user.id)

@router.post("/pockets/{pocket_id}/fund", response_model=PocketResponse)
async def api_fund_pocket(
    pocket_id: str,
    payload: PocketFund,
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """Mueve dinero entre la cuenta principal y el bolsillo (monto positivo o negativo)."""
    try:
        return await fund_pocket(db, current_user.id, pocket_id, payload.amount_cents)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/pockets/{pocket_id}", response_model=PocketResponse)
async def api_update_pocket(
    pocket_id: str,
    payload: PocketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """Actualiza el nombre o la meta de un bolsillo."""
    try:
        return await update_pocket(db, current_user.id, pocket_id, payload.name, payload.goal_cents)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
