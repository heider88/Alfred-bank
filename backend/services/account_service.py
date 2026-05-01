from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_

from models.domain import Account, Transaction

async def create_account(db: AsyncSession, owner_name: str) -> Account:
    """Creates a new account with an initial balance of 0."""
    new_account = Account(owner_name=owner_name, balance_cents=0)
    db.add(new_account)
    await db.commit()
    await db.refresh(new_account)
    return new_account

async def fund_account(db: AsyncSession, account_id: UUID, amount_cents: int) -> Account:
    """Simulates funding an account. Uses locking to update balance safely."""
    if amount_cents <= 0:
        raise ValueError("El monto a fondear debe ser mayor a 0")
        
    stmt = select(Account).where(Account.id == account_id).with_for_update()
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()
    
    if not account:
        raise ValueError("Cuenta no encontrada")
        
    account.balance_cents += amount_cents
    
    deposit_tx = Transaction(to_account_id=account_id, amount_cents=amount_cents)
    db.add(deposit_tx)
    
    await db.commit()
    await db.refresh(account)
    return account

async def get_account_statement(db: AsyncSession, account_id: UUID) -> dict:
    """Retrieves current balance and transaction history ordered by date descending."""
    stmt_acc = select(Account).where(Account.id == account_id)
    res_acc = await db.execute(stmt_acc)
    account = res_acc.scalar_one_or_none()
    
    if not account:
        raise ValueError("Cuenta no encontrada")
        
    # Obtener transacciones donde la cuenta sea origen o destino
    stmt_tx = select(Transaction).where(
        or_(Transaction.from_account_id == account_id, Transaction.to_account_id == account_id)
    ).order_by(desc(Transaction.timestamp))
    
    res_tx = await db.execute(stmt_tx)
    transactions = res_tx.scalars().all()
    
    return {
        "account_id": account.id,
        "balance_cents": account.balance_cents,
        "transactions": transactions
    }
