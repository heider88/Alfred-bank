from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Importamos la configuración de base de datos y la metadata
from core.database import engine, Base
# Importamos explícitamente los modelos para que Base.metadata los reconozca al crear las tablas
from models.domain import Account, Transaction
from api.routes import router as api_router
from api.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Context Manager para manejar el ciclo de vida de la aplicación.
    Ejecuta la creación asíncrona de las tablas en PostgreSQL al arrancar.
    """
    async with engine.begin() as conn:
        # Crea las tablas si no existen en la base de datos habi_db
        await conn.run_sync(Base.metadata.create_all)
    
    yield # La aplicación maneja peticiones aquí
    
    # Cierre limpio de las conexiones al detener el servidor
    await engine.dispose()

app = FastAPI(
    title="Habi Fintech API",
    description="Backend escalable utilizando FastAPI, Clean Architecture y PostgreSQL Asíncrono",
    version="1.0.0",
    lifespan=lifespan
)

# Configuración estricta de CORS para permitir la comunicación con el Frontend (Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Exception Handlers Globales ---

@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError):
    """
    Captura errores de lógica de negocio lanzados como ValueError 
    (ej. fondos insuficientes, reglas de negocio violadas) 
    y retorna un JSON estructurado con status 400 Bad Request.
    """
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": True,
            "status_code": status.HTTP_400_BAD_REQUEST,
            "message": str(exc),
            "path": request.url.path
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Mantiene la compatibilidad atrapando las excepciones estándar de FastAPI (HTTPException).
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail,
            "path": request.url.path
        }
    )

# --- Inclusión de Rutas ---

app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(api_router, prefix="/api/v1")

# --- Endpoints Básicos ---

@app.get("/", tags=["Health"])
async def root():
    """Endpoint de Health Check para monitoreo de la infraestructura."""
    return {
        "status": "online", 
        "message": "Fintech API core running smoothly connected to habi_db",
        "environment": "production"
    }
