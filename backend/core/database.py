import os
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# Obtener URL de conexión. Usamos SQLite en memoria como fallback si no existe (para evitar que Cloud Run crashee en el arranque)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

# Configuración del motor asíncrono (SQLAlchemy 2.0)
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False, # Apagado para producción (activar solo para debugear SQL)
    pool_pre_ping=True, # Verifica que la conexión a PostgreSQL esté viva antes de usarla
)

# Creador de sesiones asíncronas
async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Base class para los modelos de SQLAlchemy
Base = declarative_base()

# Dependencia para inyectar la sesión de base de datos en los endpoints (FastAPI)
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        except Exception:
            # Rollback en caso de que ocurra cualquier excepción no controlada
            await session.rollback()
            raise
        finally:
            await session.close()
