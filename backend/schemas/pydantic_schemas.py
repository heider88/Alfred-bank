from pydantic import BaseModel, Field, UUID4, EmailStr
from typing import List, Optional
from datetime import datetime

# --- Auth Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID4] = None

# --- Account Schemas ---

class AccountCreate(BaseModel):
    owner_name: str = Field(..., min_length=1, description="Nombre del titular de la cuenta")
    email: EmailStr = Field(..., description="Correo electrónico único del usuario")
    password: str = Field(..., min_length=6, description="Contraseña de la cuenta")

class AccountResponse(BaseModel):
    id: UUID4
    owner_name: str
    email: str
    balance_cents: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AccountBalance(BaseModel):
    id: UUID4 = Field(..., description="ID único de la cuenta")
    balance_cents: int = Field(..., description="Saldo actual en centavos")
    
    class Config:
        from_attributes = True

class AccountNameResponse(BaseModel):
    owner_name: str

class FundPayload(BaseModel):
    amount_cents: int = Field(..., gt=0, description="Monto a fondear en centavos")

# --- Transaction Schemas ---

class TransferPayload(BaseModel):
    from_account_id: UUID4 = Field(..., description="ID de la cuenta de origen")
    to_account_id: UUID4 = Field(..., description="ID de la cuenta de destino")
    amount_cents: int = Field(..., gt=0, description="Monto a transferir en centavos (debe ser mayor a 0)")
    description: Optional[str] = Field("Transferencia", description="Concepto de la transferencia")

class TransactionResponse(BaseModel):
    id: UUID4
    from_account_id: Optional[UUID4] = None
    to_account_id: UUID4
    amount_cents: int
    description: Optional[str] = None
    timestamp: datetime
    counterparty_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class StatementResponse(BaseModel):
    account_id: UUID4
    balance_cents: int
    transactions: List[TransactionResponse]

# --- Chat Schemas ---

class ChatRequest(BaseModel):
    account_id: UUID4 = Field(..., description="ID de la cuenta del usuario")
    message: str = Field(..., description="Mensaje del usuario")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Respuesta del asistente AI")
