import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
import sys
import os

# Asegurar que los imports relativos funcionen si se llama desde otra ruta
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import async_session_maker, engine, Base
from models.domain import Account, Transaction
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def run_seed():
    # 1. Asegurar que las tablas existan antes de insertar
    async with engine.begin() as conn:
        # Ya no destruimos todo para mantener los datos de los usuarios
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy import select
    async with async_session_maker() as session:
        # 2. Verificar si la base de datos ya tiene usuarios
        result = await session.execute(select(Account).limit(1))
        existing_account = result.scalar_one_or_none()
        
        if existing_account:
            print("✨ La base de datos ya contiene datos. Omitiendo la siembra (seed) para no borrar tus usuarios.")
            return

        print("🧹 Limpiando base de datos...")
        # TRUNCATE borra todo. CASCADE asegura que borre llaves foráneas.
        # RESTART IDENTITY por si hay autoincrementales, aunque aquí usamos UUIDs.
        await session.execute(text("TRUNCATE TABLE transactions, accounts RESTART IDENTITY CASCADE;"))
        
        print("👤 Creando cuenta principal para Juan Pérez...")
        juan_id = uuid.UUID("51014194-7f66-4424-8035-9faf861ed86f")
        juan = Account(
            id=juan_id,
            owner_name="Juan Pérez",
            email="juan@alfred.bank",
            hashed_password=get_password_hash("123456"),
            balance_cents=250030000  # $2,500,300 COP en centavos
        )
        
        # Cuentas externas ficticias para simular origen/destino de las transacciones
        nomina_id = uuid.uuid4()
        externa_id = uuid.uuid4()
        
        externas = [
            Account(id=nomina_id, owner_name="Empresa Habi", email="nomina@habi.com", hashed_password=get_password_hash("123456"), balance_cents=0),
            Account(id=externa_id, owner_name="Comercios", email="comercios@habi.com", hashed_password=get_password_hash("123456"), balance_cents=0)
        ]
        
        session.add(juan)
        session.add_all(externas)
        await session.commit()
        
        print("💸 Generando transacciones variadas...")
        now = datetime.now(timezone.utc)
        
        transacciones = [
            # --- INGRESOS ---
            Transaction(
                from_account_id=nomina_id,
                to_account_id=juan_id,
                amount_cents=550000000, # 5.5M COP
                description="Pago de Nómina Habi",
                timestamp=now - timedelta(days=6)
            ),
            Transaction(
                from_account_id=externa_id,
                to_account_id=juan_id,
                amount_cents=35000000, # 350k COP
                description="Transferencia Recibida",
                timestamp=now - timedelta(days=2)
            ),
            
            # --- GASTOS ---
            Transaction(
                from_account_id=juan_id,
                to_account_id=externa_id,
                amount_cents=180000000, # 1.8M COP
                description="Pago Arriendo",
                timestamp=now - timedelta(days=5)
            ),
            Transaction(
                from_account_id=juan_id,
                to_account_id=externa_id,
                amount_cents=3500000, # 35k COP
                description="Netflix",
                timestamp=now - timedelta(days=4)
            ),
            Transaction(
                from_account_id=juan_id,
                to_account_id=externa_id,
                amount_cents=2200000, # 22k COP
                description="Starbucks",
                timestamp=now - timedelta(days=3)
            ),
            Transaction(
                from_account_id=juan_id,
                to_account_id=externa_id,
                amount_cents=45000000, # 450k COP
                description="Restaurante El Cielo",
                timestamp=now - timedelta(days=1)
            ),
            Transaction(
                from_account_id=juan_id,
                to_account_id=externa_id,
                amount_cents=12500000, # 125k COP
                description="Surtifruver",
                timestamp=now - timedelta(hours=15)
            ),
            Transaction(
                from_account_id=juan_id,
                to_account_id=externa_id,
                amount_cents=1500000, # 15k COP
                description="Starbucks",
                timestamp=now - timedelta(hours=2)
            )
        ]
        
        session.add_all(transacciones)
        await session.commit()
        
        print("✅ Base de datos poblada exitosamente.")

if __name__ == "__main__":
    # Necesario para evitar problemas con el event loop en algunos sistemas operativos
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    asyncio.run(run_seed())
