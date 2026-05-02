from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_

from models.domain import Account, Transaction
from core.security import get_password_hash

async def create_account(db: AsyncSession, owner_name: str, email: str, password: str) -> Account:
    """Creates a new account with an initial balance."""
    hashed_password = get_password_hash(password)
    # Bono de bienvenida de $500,000 COP (50,000,000 centavos)
    welcome_bonus_cents = 50000000 
    
    new_account = Account(
        owner_name=owner_name, 
        email=email,
        hashed_password=hashed_password,
        balance_cents=welcome_bonus_cents
    )
    db.add(new_account)
    await db.flush()  # Para obtener el ID generado y poder asignarlo a la transaccion
    
    # Registrar el bono como una transacción inicial
    bonus_tx = Transaction(
        to_account_id=new_account.id, 
        amount_cents=welcome_bonus_cents,
        description="Bono de Bienvenida"
    )
    db.add(bonus_tx)
    
    await db.commit()
    await db.refresh(new_account)
    return new_account

async def fund_account(db: AsyncSession, account_id: str, amount_cents: int) -> Account:
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

async def get_account_statement(db: AsyncSession, account_id: str) -> dict:
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
    
    # Extraer IDs únicos para buscar los nombres
    account_ids = set()
    for tx in transactions:
        if tx.from_account_id: account_ids.add(tx.from_account_id)
        account_ids.add(tx.to_account_id)
        
    names_map = {}
    if account_ids:
        stmt_names = select(Account.id, Account.owner_name).where(Account.id.in_(account_ids))
        res_names = await db.execute(stmt_names)
        names_map = {row.id: row.owner_name for row in res_names.all()}
        
    tx_list = []
    for tx in transactions:
        is_deposit = tx.to_account_id == account_id
        counterparty_id = tx.from_account_id if is_deposit else tx.to_account_id
        counterparty_name = names_map.get(counterparty_id, "Externo") if counterparty_id else "Externo"
        
        tx_dict = {
            "id": tx.id,
            "from_account_id": tx.from_account_id,
            "to_account_id": tx.to_account_id,
            "amount_cents": tx.amount_cents,
            "description": tx.description,
            "timestamp": tx.timestamp,
            "counterparty_name": counterparty_name
        }
        tx_list.append(tx_dict)
    
    return {
        "account_id": account.id,
        "balance_cents": account.balance_cents,
        "transactions": tx_list
    }
