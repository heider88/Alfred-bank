import string
import random
import uuid
from sqlalchemy import Column, String, BigInteger, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from core.database import Base

def generate_account_id():
    return "".join(random.choices(string.digits, k=10))

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, default=generate_account_id, index=True)
    owner_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    balance_cents = Column(BigInteger, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pockets = relationship("Pocket", back_populates="account")

    __table_args__ = (
        CheckConstraint('balance_cents >= 0', name='check_positive_balance'),
    )

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    from_account_id = Column(String, ForeignKey("accounts.id"), nullable=True, index=True)
    to_account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    
    amount_cents = Column(BigInteger, nullable=False)
    description = Column(String, nullable=True, server_default="Transferencia")
    
    __table_args__ = (
        CheckConstraint('amount_cents > 0', name='check_positive_amount'),
    )
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class Pocket(Base):
    __tablename__ = "pockets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    balance_cents = Column(BigInteger, default=0, nullable=False)
    goal_cents = Column(BigInteger, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    account = relationship("Account", back_populates="pockets")

    __table_args__ = (
        CheckConstraint('balance_cents >= 0', name='check_positive_pocket_balance'),
    )

