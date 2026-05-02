import uuid
from sqlalchemy import Column, String, BigInteger, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from core.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    owner_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Almacenar en unidades mínimas (centavos) evita problemas de precisión en punto flotante
    balance_cents = Column(BigInteger, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint('balance_cents >= 0', name='check_positive_balance'),
    )

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    # from_account_id puede ser nulo en caso de un depósito inicial externo
    from_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=True, index=True)
    to_account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False, index=True)
    
    amount_cents = Column(BigInteger, nullable=False)
    description = Column(String, nullable=True, server_default="Transferencia")
    
    # constraint para asegurar que el monto de la transacción sea positivo
    __table_args__ = (
        CheckConstraint('amount_cents > 0', name='check_positive_amount'),
    )
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
