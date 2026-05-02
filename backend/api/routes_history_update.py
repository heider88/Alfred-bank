import sys

with open('backend/api/routes.py', 'r') as f:
    content = f.read()

# Add imports for AIMessage, HumanMessage, SystemMessage
if "from langchain_core.messages import AIMessage" not in content:
    content = content.replace("from langchain_core.messages import ToolMessage", "from langchain_core.messages import ToolMessage, AIMessage, HumanMessage, SystemMessage")

old_chain_code = """        prompt = ChatPromptTemplate.from_messages([
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
        )"""

new_chain_code = """        system_template = \"\"\"Eres Alfred, el asesor financiero inteligente de Alfred Bank.
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

Responde SIEMPRE en formato Markdown limpio, usando negritas para el dinero.\"\"\"
        
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
        messages.append(HumanMessage(content=payload.message))"""

if old_chain_code in content:
    content = content.replace(old_chain_code, new_chain_code)
else:
    print("WARNING: Could not find the prompt template segment.")

with open('backend/api/routes.py', 'w') as f:
    f.write(content)
print("Updated routes successfully with conversation history logic.")
