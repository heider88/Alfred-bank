import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import async_session_maker, engine, Base
from models.domain import Account, Transaction, generate_account_id
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def run_seed():
    async with engine.begin() as conn:
        # Drop todo y recrear debido al cambio de UUID a String en la DB
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy import select
    async with async_session_maker() as session:
        print("🧹 Limpiando base de datos y recreando tablas...")
        
        print("👤 Creando cuenta principal para Juan Pérez...")
        juan_id = "0000000001"
        juan = Account(
            id=juan_id,
            owner_name="Juan Pérez",
            email="juan@alfred.bank",
            hashed_password=get_password_hash("AlfredSecure2026*"),
            balance_cents=250030000  # $2,500,300 COP en centavos
        )
        
        nomina_id = generate_account_id()
        externa_id = generate_account_id()
        
        externas = [
            Account(id=nomina_id, owner_name="Empresa Alfred", email="nomina@alfred.com", hashed_password=get_password_hash("AlfredSecure2026*"), balance_cents=0),
            Account(id=externa_id, owner_name="Comercios", email="comercios@alfred.com", hashed_password=get_password_hash("AlfredSecure2026*"), balance_cents=0)
        ]
        
        session.add(juan)
        session.add_all(externas)
        await session.commit()
        
        print("💸 Generando transacciones variadas...")
        now = datetime.now(timezone.utc)
        
        transacciones = [
            Transaction(
                from_account_id=nomina_id,
                to_account_id=juan_id,
                amount_cents=550000000, 
                description="Pago de Nómina Alfred",
                timestamp=now - timedelta(days=6)
            ),
            Transaction(
                from_account_id=externa_id,
                to_account_id=juan_id,
                amount_cents=35000000, 
                description="Transferencia Recibida",
                timestamp=now - timedelta(days=2)
            ),
            Transaction(
                from_account_id=juan_id,
                to_account_id=externa_id,
                amount_cents=180000000, 
                description="Pago Arriendo",
                timestamp=now - timedelta(days=5)
            ),
            Transaction(
                from_account_id=juan_id,
                to_account_id=externa_id,
                amount_cents=3500000, 
                description="Netflix",
                timestamp=now - timedelta(days=4)
            ),
            Transaction(
                from_account_id=juan_id,
                to_account_id=externa_id,
                amount_cents=2200000, 
                description="Starbucks",
                timestamp=now - timedelta(days=3)
            )
        ]
        
        session.add_all(transacciones)
        await session.commit()
        
        print("✅ Base de datos poblada exitosamente.")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_seed())
