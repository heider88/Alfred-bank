from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

# --- Auth Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

# --- Account Schemas ---

class AccountCreate(BaseModel):
    owner_name: str = Field(..., min_length=1, description="Nombre del titular de la cuenta")
    email: EmailStr = Field(..., description="Correo electrónico único del usuario")
    password: str = Field(..., min_length=6, description="Contraseña de la cuenta")

class AccountResponse(BaseModel):
    id: str
    owner_name: str
    email: str
    balance_cents: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccountBalance(BaseModel):
    id: str = Field(..., description="ID único de la cuenta")
    balance_cents: int = Field(..., description="Saldo actual en centavos")
    
    class Config:
        from_attributes = True

class AccountNameResponse(BaseModel):
    owner_name: str

class FundPayload(BaseModel):
    amount_cents: int = Field(..., gt=0, description="Monto a fondear en centavos")

# --- Transaction Schemas ---

class TransferPayload(BaseModel):
    from_account_id: str = Field(..., description="ID de la cuenta de origen")
    to_account_id: str = Field(..., description="ID de la cuenta de destino")
    amount_cents: int = Field(..., gt=0, description="Monto a transferir en centavos (debe ser mayor a 0)")
    description: Optional[str] = Field("Transferencia", description="Concepto de la transferencia")

class TransactionResponse(BaseModel):
    id: str
    from_account_id: Optional[str] = None
    to_account_id: str
    amount_cents: int
    description: Optional[str] = None
    timestamp: datetime
    counterparty_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class StatementResponse(BaseModel):
    account_id: str
    balance_cents: int
    transactions: List[TransactionResponse]

# --- Pocket Schemas ---

class PocketCreate(BaseModel):
    name: str = Field(..., description="Nombre del bolsillo")
    goal_cents: Optional[int] = Field(None, description="Meta de ahorro en centavos")

class PocketFund(BaseModel):
    amount_cents: int = Field(..., gt=0, description="Monto a agregar o retirar del bolsillo (positivo o negativo)")

class PocketResponse(BaseModel):
    id: str
    account_id: str
    name: str
    balance_cents: int
    goal_cents: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Chat Schemas ---

class ChatRequest(BaseModel):
    account_id: str = Field(..., description="ID de la cuenta del usuario")
    message: str = Field(..., description="Mensaje del usuario")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Respuesta del asistente AI")
