# Alfred Bank 

¡Hola! Soy Heider Navarro. 

Aquí abajo te explico detalladamente cómo pensé, diseñé y ejecuté este proyecto.

## 🚀 El Núcleo y "Lo que me emociona"

**El Núcleo:** El sistema cumple con todo lo requerido:
1. Crear cuenta (con encriptación bcrypt y validación).
2. Cargar saldo (simulado mediante un bono automático al crear la cuenta).
3. Transferir saldo (con bloqueos a nivel de fila en BD y enmascaramiento de nombres reales por seguridad).
4. Consultar saldo (protegido por JWT).
5. Historial de movimientos (con nombres de contrapartes y conceptos).

**Lo que me emociona (El Feature Extra):**
En el reto mencionan: *"Los bancos mueven plata pero no entienden contexto... Todo queda como líneas sueltas en un extracto."* 

Por eso decidí construir a **Alfred, el CFO Personal impulsado por IA**. 
En lugar de simplemente hacer un sistema de bolsillos o división de cuentas tradicional, integré **LangChain + Google Gemini 2.5 Flash**. 
Alfred tiene acceso al contexto financiero *en tiempo real* del usuario (saldo y últimas transacciones). Esto permite que el usuario le pregunte en lenguaje natural: *"¿Cuánto me he gastado en cenas?"* o *"¿Debería ahorrar este mes?"*, dándole por fin "contexto" a las líneas sueltas de un extracto bancario.

## 🛠️ Stack Tecnológico y Decisiones Clave

Decidí usar un stack moderno, asíncrono y robusto.

**Backend: FastAPI + PostgreSQL (AsyncPG) + SQLAlchemy**
- **¿Por qué FastAPI?:** Por su velocidad y su naturaleza asíncrona nativa. En un sistema de pagos, bloquear el event loop por una consulta a BD es un crimen.
- **¿Por qué PostgreSQL?:** Necesitaba garantías ACID estrictas.
- **Protección del Dinero (Lo más crítico):** Para asegurar que el sistema "no pierda un peso", implementé transacciones de base de datos con **Row-Level Locking (`with_for_update`)**. Cuando hay una transferencia, bloqueo las filas de las dos cuentas involucradas. Esto evita *Race Conditions* (doble gasto) si dos peticiones de transferencia ocurren exactamente al mismo milisegundo.
- **Manejo de Moneda:** Jamás usé `float`. Todo el dinero se maneja en **centavos (`BigInteger`)**. Esto evita los clásicos errores de pérdida de precisión en punto flotante que ocurren en JS/Python.

**Frontend: Next.js 14 + TailwindCSS**
- Elegí Next.js por su estructura de enrutamiento y Tailwind por la velocidad para iterar una UI "High-End". Quería que la aplicación no solo funcionara, sino que se viera como una Fintech en la que confiarías tu dinero.
- Tiene validaciones de formularios con `Zod` y `react-hook-form`.

## 🧠 ¿Qué dejé fuera y por qué?

- **Paginación en el Historial:** El endpoint devuelve todas las transacciones. En un escenario real con miles de movimientos, esto saturaría la BD. Lo dejé fuera por tiempo, pero implementaría cursor-based pagination (ideal para feeds infinitos).
- **Webhooks/Eventos Asíncronos:** En un sistema real, una transferencia exitosa debería disparar un evento (Kafka/RabbitMQ) para enviar notificaciones Push o emails. Aquí todo es síncrono.
- **Microservicios:** Mantuve un monolito modular. No tenía sentido levantar una infraestructura compleja de microservicios para este alcance de dominio.

## ⏱️ Qué harías distinto con más tiempo

- **Mayor cobertura de testeo masivo:** Aunque tengo `pytest` probando los escenarios críticos (ej. robo de fondos inversos), escribiría una suite robusta de Test Driven Development (TDD) simulando concurrencia masiva (stress testing) en el endpoint de transferencias para probar mis bloqueos de base de datos.
- **Caché en Redis:** Poner un Redis en el endpoint de `/me` y de `statement`, invalidando la caché únicamente cuando ocurra un evento de transferencia.

## 🤷‍♂️ Qué NO sé

- No sé configurar despliegues en Kubernetes (K8s) desde cero. Conozco Docker y docker-compose, pero la orquestación masiva en clústeres no es mi fuerte actual.
- No tengo experiencia profunda afinando los *pool de conexiones* de bases de datos para soportar miles de TPS (Transactions per Second) bajo alta carga. Conozco la teoría, pero no he afinado un Postgres de producción al límite.

## 🤖 Cómo usé IA en este reto

Para mí la IA no es un buscador de Google glorificado, es mi Pair Programmer.
1. **Generación de UI (Tailwind):** En lugar de escribir divs desde cero, le pasaba a la IA *prompts* descriptivos de diseño (ej: "Haz un modal estilo Apple, con blur en el fondo, botones redondeados"). Yo tomaba las decisiones de arquitectura de React, la IA escupía el CSS tedioso.
2. **Refactorización de Bugs:** Cuando tuve un problema de dependencias obsoleto con `passlib` y `bcrypt` al generar el seed, le pasé el log de error completo a la IA para que identificara en qué versión específica se rompió la compatibilidad.
3. **Integración de LangChain:** Usé la IA para estructurar el *system prompt* de Alfred. Iteramos juntos sobre qué variables inyectarle al prompt para que el LLM no alucinara datos de otras cuentas.

## 💡 Qué aprendí

- **LangChain en producción:** Fue la primera vez que inyecto datos transaccionales transitorios como "memoria de corto plazo" en un LLM de forma segura, asegurándome de no filtrar datos de otra sesión por error (usando el JWT como barrera de contexto).
- **Manejo de Alembic con Datos Existentes:** Aprendí a los golpes que agregar una columna `NOT NULL` en Alembic a una tabla que ya tiene datos requiere migraciones en múltiples pasos (crear nullable, rellenar datos, hacerla not null) o hacer un Drop total en entornos de desarrollo.

---

### Cómo levantar el proyecto
1. Debes tener Docker y Docker Compose instalados (con soporte de `sudo`).
2. Crea un archivo `.env` en la carpeta backend con tus credenciales (asegúrate de que tenga la llave de `GEMINI_API_KEY`).
3. Ejecuta el script mágico en la raíz:
   ```bash
   ./start.sh
   ```
   *Este script levantará la base de datos, sembrará datos de prueba simulados y levantará backend y frontend.*
