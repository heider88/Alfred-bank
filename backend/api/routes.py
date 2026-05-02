from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
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
    ChatResponse
)

from services.transaction_service import execute_transfer
from services.account_service import create_account, fund_account, get_account_statement

from api.dependencies import get_current_user
from models.domain import Account

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
    account_id: UUID, 
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
    if str(payload.from_account_id) != str(current_user.id):
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
    account_id: UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    """
    Obtiene el estado de cuenta de un usuario.
    Solo permite obtener si el account_id pertenece al usuario autenticado.
    """
    if str(account_id) != str(current_user.id):
         raise HTTPException(status_code=403, detail="Acceso denegado a esta cuenta")

    return await get_account_statement(db, account_id)

@router.get("/accounts/{account_id}/name", response_model=AccountNameResponse)
async def get_account_name(
    account_id: UUID,
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
        if str(payload.account_id) != str(current_user.id):
            raise HTTPException(status_code=403, detail="Acceso denegado al contexto de esta cuenta")
        # 1. Obtener estado de cuenta
        statement = await get_account_statement(db, payload.account_id)
        
        # 2. Formatear saldo
        balance_cop = f"${statement['balance_cents'] / 100:,.2f} COP"
        
        # 3. Formatear últimas 5 transacciones
        transactions = statement['transactions'][:5]
        if not transactions:
            tx_history = "Sin movimientos recientes"
        else:
            tx_lines = []
            for tx in transactions:
                # Determinar si es ingreso o egreso comparando to_account_id con account_id
                # tx es ahora un diccionario retornado por get_account_statement
                is_deposit = tx["to_account_id"] == payload.account_id
                sign = "+" if is_deposit else "-"
                amount = f"${tx['amount_cents'] / 100:,.2f} COP"
                date_str = tx['timestamp'].strftime("%Y-%m-%d %H:%M") if tx.get('timestamp') else "N/A"
                desc = tx.get("description", "Movimiento") or "Movimiento"
                counterparty = tx.get("counterparty_name", "Externo")
                tx_lines.append(f"- {date_str}: {sign}{amount} ({desc} - Contraparte: {counterparty})")
            tx_history = "\n".join(tx_lines)
            
        # 4. Configurar LangChain
        # Usamos un modelo estable que LangChain soporte correctamente en su versión actual
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Eres Alfred, el asesor financiero inteligente de Alfred Bank.
Contexto financiero en tiempo real del usuario:

Saldo Actual: {current_balance}

Últimos Movimientos:
{transaction_history}
Tus Reglas:

Eres directo, minimalista y sofisticado. Tono de mayordomo moderno.

Solo hablas de finanzas y del contexto proporcionado.

Si el saldo es bajo, sugiere moderar gastos elegantemente.

Recomienda la creación de 'Bolsillos' o metas si ves un patrón de ahorro.

Responde SIEMPRE en formato Markdown limpio, usando negritas para el dinero."""),
            ("human", "{user_question}")
        ])
        
        chain = prompt | llm
        
        # 5. Ejecutar cadena
        response = await chain.ainvoke({
            "current_balance": balance_cop,
            "transaction_history": tx_history,
            "user_question": payload.message
        })
        
        return ChatResponse(reply=response.content)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor de chat: {str(e)}")
