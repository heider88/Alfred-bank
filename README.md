# Alfred Bank - Reto Técnico HabiCapital 2026-Q2

**🌐 Link del proyecto en producción:** [https://alfred-bank.vercel.app/](https://alfred-bank.vercel.app/)

¡Hola! Soy Heider Navarro.

Aquí abajo detallo cómo pensé, diseñé y ejecuté este proyecto respondiendo al reto de HabiCapital. No hice una app más de transferencias, construí un sistema financiero inteligente.

## 🚀 El Núcleo y "Lo que me emociona"

**El Núcleo (Lo obligatorio):** 
El sistema cumple con el ciclo financiero básico de manera segura:
1. Crear cuenta (encriptación bcrypt).
2. Cargar saldo (simulado mediante un bono automático al crear la cuenta).
3. Transferir saldo a otros.
4. Consultar saldo en tiempo real.
5. Historial de movimientos detallado.

**Lo que me emociona (El Feature Extra):**
En el reto mencionan: *"Los bancos mueven plata pero no entienden contexto... Todo queda como líneas sueltas en un extracto."*

Para resolver esto, creé a **Alfred, un CFO Personal impulsado por IA (Gemini 2.5 Flash + LangChain)**.
Pero Alfred no es solo un RAG (lector de base de datos). **Alfred tiene "manos"**.
Implementé *Function Calling (Herramientas)* en el LLM. Si un usuario le dice a Alfred: *"Crea un bolsillo para mis vacaciones en Japón con $50,000"*, Alfred no te da instrucciones; él va, verifica tu saldo, se conecta a la base de datos, te descuenta la plata de la cuenta principal, crea el bolsillo, te aparta los fondos y te responde confirmando la acción. Le di a la IA la capacidad de ejecutar lógica de negocio real.

Además, integré **OCR con Gemini Vision** para dividir cuentas de restaurantes con amigos, extrayendo ítems automáticamente de una foto y generando un código QR dinámico para cobrarles.

## 🛡️ "Esto es plata. Tu sistema no puede perder un peso." (La Protección)

Asegurar la concurrencia y la precisión matemática fue mi prioridad número uno:

1. **La regla de los Centavos (Adiós Floats):** Jamás usé `float` para guardar dinero. Manejar plata con floats genera pérdida de precisión por cómo la CPU calcula los decimales. En toda la base de datos, el dinero es un `BigInteger` (centavos). $50.000 COP se guardan como `5000000`. Solo se dividen por 100 al momento de pintar en el Frontend (Next.js).
2. **Row-Level Locking (`with_for_update`):** El mayor riesgo en una Fintech es el *Race Condition* (Doble Gasto). Si un usuario con $10,000 manda dos peticiones de $10,000 en el mismo milisegundo, un backend mal hecho aprobaría ambas. En mis servicios (`transaction_service.py`), cuando inicia una transferencia, PostgreSQL **bloquea la fila del usuario origen y la del destino** (`SELECT ... FOR UPDATE`). Si llega otra petición simultánea, tiene que hacer fila hasta que la primera transacción termine y libere el saldo real.
3. **Validaciones en Base de Datos (Check Constraints):** Agregué un `CheckConstraint('balance_cents >= 0')` directo en PostgreSQL. Incluso si mi lógica de Python fallara catastróficamente, la base de datos físicamente rechazará cualquier transacción que deje una cuenta en negativo.

## 🛠️ Stack Tecnológico y Decisiones Clave

- **Backend: FastAPI + PostgreSQL (AsyncPG) + SQLAlchemy 2.0**
  Por la asincronía. Bloquear el hilo principal en Python durante llamadas I/O a base de datos limita la escalabilidad. `AsyncPG` permite manejar miles de transacciones concurrentes.
- **Frontend: Next.js 14 + TailwindCSS**
  Buscaba una interfaz "High-End" (neo-brutalista) rápida de iterar.

## 🧠 ¿Qué dejé fuera y por qué?

- **Paginación en el Historial:** Actualmente `/statement` trae todo. A escala, saturaría. Lo dejé fuera por priorizar las herramientas de la IA (Bolsillos).
- **Webhooks/Kafka:** Las notificaciones (la campanita en el nav) se hacen con *polling* al historial. En producción, una transferencia usaría Arquitectura Orientada a Eventos para notificar en tiempo real por WebSockets o SSE sin golpear la BD.

## ⏱️ Qué harías distinto con más tiempo

- **Tests de Concurrencia (Stress Testing):** Construiría scripts en Locust o k6 disparando miles de TPS (Transactions per Second) sobre una misma cuenta para probar empíricamente mis bloqueos `FOR UPDATE` y los bloqueos a nivel de Base de Datos.
- **Memoria persistente para el LLM:** Ahora el historial de chat se manda desde el Frontend en el payload. Lo ideal sería usar `PostgresChatMessageHistory` en LangChain para guardar los hilos en BD.

## 🤷‍♂️ Qué NO sé 

- **No soy experto en Cloud Run a nivel profundo de Redes (VPCs):** Justamente el despliegue me costó bastante por entender cómo Cloud Run y las bases de datos externas se comunicaban sin un Serverless VPC Connector configurado adecuadamente.
- **Tuning de Pool de Conexiones:** Sé la teoría de asincronía, pero afinar el `pool_size` de SQLAlchemy con `PgBouncer` frente a cuellos de botella reales en producción, es algo en lo que aún me falta "callo" de trincheras.

## 🤖 Cómo usé IA en este reto (Mi relación con ella)

Usé IA de forma intensiva y nativa durante **todo el ciclo de vida del desarrollo** del proyecto. Utilicé herramientas como **Opencode, Antigravity, Gemini, Skills avanzados** y diversas integraciones para potenciar cada capa del sistema.

Mi rol fue actuar como Arquitecto de Software: yo definía la estructura, establecía las reglas estrictas de negocio (como el manejo de dinero y bloqueos) y el control de flujo; mientras que mi *stack de IA* fungía como mi equipo de ingenieros para ejecutar, escribir y depurar.

- **Integración y dolor con LangChain:** LangChain cambia muchísimo entre versiones. Tuve muchos problemas para hacer que el `Tool Calling` de Alfred funcionara, ya que la API de Google a veces devolvía respuestas en listas o strings mixtos que rompían mis esquemas de Pydantic. Usé la IA para analizar los *stacktraces* en tiempo real (incluso enfrentando errores `429 RESOURCE_EXHAUSTED` por cuotas) y en *pair programming* construimos los parsers defensivos y fallbacks.
- **Despliegues frustrados:** Al pasar de local a la nube, Cloud Run mataba el contenedor por Timeouts. Trabajando directamente desde mi terminal asistida por IA, diagnosticamos que el backend crasheaba silenciosamente al intentar crear las tablas (`create_all`) sin la variable de entorno correcta. Esto derivó en la creación colaborativa de un bloqueador de errores en el ciclo `lifespan` de FastAPI.
- **Maquetado y Frontend (Skills):** Apoyándome en prompts y "Skills" específicos de diseño UI, pedía componentes funcionales complejos como: *"crea un historial estilo tailwind, neo-brutalista, con gráficos de Recharts"*. Esto me ahorró decenas de horas de CSS manual para enfocarme en la lógica y la seguridad.

## 💡 Qué aprendí

- A no dar por sentado los logs de despliegue. Aprendí a manejar los eventos de inicio (`lifespan`) en FastAPI de manera defensiva (try-except) para que los contenedores sobrevivan arranques lentos de BD.
- A orquestar llamadas complejas de LLMs. Logré que un modelo matemático generativo decida, extraiga parámetros, espere la respuesta de PostgreSQL y le hable al usuario confirmando una transacción de dinero real. Eso me voló la cabeza.


---

## 🎮 Cómo probar el producto

Tienes dos opciones para evaluar el sistema:

### Opción 1: En Producción (Recomendado y rápido)
1. Ingresa a la app desplegada: **[https://alfred-bank.vercel.app/](https://alfred-bank.vercel.app/)**
2. **Crea una cuenta nueva** en la página de registro. Al crearla, el sistema te asignará de forma automática el "Bono de bienvenida" de **$500,000 COP** para que tengas fondos iniciales.
3. Prueba la plataforma:
   - Dirígete a **Bolsillos** y crea una nueva meta de ahorro (Añade y retira dinero de tus metas).
   - Pásate por **Dividir Cuenta** y sube una foto de una factura de un restaurante para ver el OCR de Gemini en acción y la generación de cobros con códigos QR.
   - Habla con **Alfred (el chat flotante en cualquier pantalla)** y dile: *"Crea un bolsillo para mi viaje a Japón por $50,000"*. Observa cómo la IA entiende tu intención, ejecuta el código (Function Calling) contra la base de datos y cómo tu saldo disminuye automáticamente informándote del éxito de la transacción.
   - Revisa en **Historial** cómo la IA categorizó automáticamente las transacciones y expórtalo como PDF.

### Opción 2: Correrlo en Local
1. Debes tener Docker y Docker Compose instalados.
2. Crea un archivo `.env` en la carpeta `/backend` con tus credenciales. Asegúrate de incluir un `GEMINI_API_KEY` válido (obtenido de Google AI Studio) y el `DATABASE_URL` apuntando a tu PostgreSQL local.
3. En la raíz del proyecto, dale permisos y ejecuta el script de automatización bash:
   ```bash
   chmod +x start.sh
   ./start.sh
   ```
   *Este script levantará el contenedor de PostgreSQL, aplicará el script para inyectar datos falsos iniciales, iniciará el backend de FastAPI en el puerto 8000 y el frontend de Next.js en el 3000, dejándolo todo conectado en segundos.*