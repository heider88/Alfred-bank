from pydantic import BaseModel, Field, UUID4
from typing import List, Optional
from datetime import datetime

# --- Account Schemas ---

class AccountCreate(BaseModel):
    owner_name: str = Field(..., min_length=1, description="Nombre del titular de la cuenta")

class AccountBalance(BaseModel):
    id: UUID4 = Field(..., description="ID único de la cuenta")
    balance_cents: int = Field(..., description="Saldo actual en centavos")
    
    class Config:
        from_attributes = True

class AccountResponse(BaseModel):
    id: UUID4
    owner_name: str
    balance_cents: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class FundPayload(BaseModel):
    amount_cents: int = Field(..., gt=0, description="Monto a fondear en centavos")

# --- Transaction Schemas ---

class TransferPayload(BaseModel):
    from_account_id: UUID4 = Field(..., description="ID de la cuenta de origen")
    to_account_id: UUID4 = Field(..., description="ID de la cuenta de destino")
    amount_cents: int = Field(..., gt=0, description="Monto a transferir en centavos (debe ser mayor a 0)")

class TransactionResponse(BaseModel):
    id: UUID4
    from_account_id: Optional[UUID4] = None
    to_account_id: UUID4
    amount_cents: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class StatementResponse(BaseModel):
    account_id: UUID4
    balance_cents: int
    transactions: List[TransactionResponse]
