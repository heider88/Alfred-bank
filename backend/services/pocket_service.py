from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.domain import Account, Pocket, Transaction

async def create_pocket(db: AsyncSession, account_id: str, name: str, goal_cents: int = None) -> Pocket:
    new_pocket = Pocket(
        account_id=account_id,
        name=name,
        goal_cents=goal_cents,
        balance_cents=0
    )
    db.add(new_pocket)
    await db.commit()
    await db.refresh(new_pocket)
    return new_pocket

async def get_pockets(db: AsyncSession, account_id: str):
    stmt = select(Pocket).where(Pocket.account_id == account_id)
    result = await db.execute(stmt)
    return result.scalars().all()

async def fund_pocket(db: AsyncSession, account_id: str, pocket_id: str, amount_cents: int) -> Pocket:
    # amount_cents can be negative to withdraw from pocket back to main account
    if amount_cents == 0:
        raise ValueError("El monto no puede ser cero")
        
    stmt_acc = select(Account).where(Account.id == account_id).with_for_update()
    res_acc = await db.execute(stmt_acc)
    account = res_acc.scalar_one_or_none()
    
    if not account:
        raise ValueError("Cuenta no encontrada")
        
    stmt_pkt = select(Pocket).where(Pocket.id == pocket_id, Pocket.account_id == account_id).with_for_update()
    res_pkt = await db.execute(stmt_pkt)
    pocket = res_pkt.scalar_one_or_none()
    
    if not pocket:
        raise ValueError("Bolsillo no encontrado")

    if amount_cents > 0:
        # Moving money from account to pocket
        if account.balance_cents < amount_cents:
            raise ValueError("Fondos insuficientes en la cuenta principal")
        account.balance_cents -= amount_cents
        pocket.balance_cents += amount_cents
        desc = f"Ahorro: {pocket.name}"
    else:
        # Moving money from pocket to account (amount_cents is negative)
        withdraw_amount = abs(amount_cents)
        if pocket.balance_cents < withdraw_amount:
            raise ValueError("Fondos insuficientes en el bolsillo")
        pocket.balance_cents -= withdraw_amount
        account.balance_cents += withdraw_amount
        desc = f"Retiro de Bolsillo: {pocket.name}"

    # Record the transaction
    # Since money stays in the same account conceptually, we just log from_account=to_account.
    # We could also use amount_cents as positive always and just change description.
    tx = Transaction(
        from_account_id=account_id,
        to_account_id=account_id,
        amount_cents=abs(amount_cents),
        description=desc
    )
    db.add(tx)
    
    await db.commit()
    await db.refresh(pocket)
    return pocket

async def update_pocket(db: AsyncSession, account_id: str, pocket_id: str, name: str = None, goal_cents: int = None) -> Pocket:
    stmt_pkt = select(Pocket).where(Pocket.id == pocket_id, Pocket.account_id == account_id).with_for_update()
    res_pkt = await db.execute(stmt_pkt)
    pocket = res_pkt.scalar_one_or_none()
    
    if not pocket:
        raise ValueError("Bolsillo no encontrado")
        
    if name is not None:
        pocket.name = name
    if goal_cents is not None:
        pocket.goal_cents = goal_cents
        
    await db.commit()
    await db.refresh(pocket)
    return pocket
