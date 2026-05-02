import sys

with open('backend/api/routes.py', 'r') as f:
    content = f.read()

# Make sure ToolMessage and tool are imported
if "from langchain_core.messages import ToolMessage" not in content:
    content = content.replace("from models.domain import Account", "from models.domain import Account\nfrom langchain_core.messages import ToolMessage\nfrom langchain_core.tools import tool")

# Replace the chat function completely to ensure it's spotless
start_idx = content.find("@router.post(\"/chat\", response_model=ChatResponse)")
end_idx = content.find("@router.post(\"/ocr/receipt\")")

new_chat = """@router.post("/chat", response_model=ChatResponse)
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
            tx_history = "\\n".join(tx_lines)
            
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
            pockets_summary = "\\n".join(pocket_lines)
            
        # 4. Configurar LangChain
        api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            from dotenv import load_dotenv
            import os
            load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
            api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
            
        if not api_key:
            raise HTTPException(status_code=500, detail="API Key de Gemini no configurada en el servidor.")
            
        llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2, google_api_key=api_key, max_retries=1)
        
        @tool
        def crear_bolsillo_y_transferir(nombre_bolsillo: str, monto_inicial: float, meta_ahorro: float = None) -> str:
            \"\"\"Crea un bolsillo de ahorro y opcionalmente le transfiere un monto inicial.
            
            Args:
                nombre_bolsillo: Nombre del bolsillo o meta de ahorro (ej. "Vacaciones", "Viaje").
                monto_inicial: Cantidad de dinero a transferir al bolsillo en COP.
                meta_ahorro: (Opcional) Meta total a ahorrar en COP.
            \"\"\"
            pass
            
        llm_with_tools = llm.bind_tools([crear_bolsillo_y_transferir])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", \"\"\"Eres Alfred, el asesor financiero inteligente de Alfred Bank.
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

Responde SIEMPRE en formato Markdown limpio, usando negritas para el dinero.\"\"\"),
            ("human", "{user_question}")
        ])
        
        messages = await prompt.aformat_messages(
            current_balance=balance_cop,
            transaction_history=tx_history,
            pockets_info=pockets_summary,
            user_question=payload.message
        )
        
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

"""

content = content[:start_idx] + new_chat + content[end_idx:]

with open('backend/api/routes.py', 'w') as f:
    f.write(content)

print("Updated routes safely")
