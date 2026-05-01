from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.domain import Account, Transaction


async def execute_transfer(
    db: AsyncSession,
    from_account_id: UUID,
    to_account_id: UUID,
    amount_cents: int
) -> Transaction:
    """
    Executes a transfer between two accounts within a single database transaction.
    Implements row-level locking to prevent race conditions.
    """
    if amount_cents <= 0:
        raise ValueError("El monto de transferencia debe ser mayor a 0")

    if from_account_id == to_account_id:
        raise ValueError("No se puede transferir a la misma cuenta")

    try:
        stmt_from = select(Account).where(Account.id == from_account_id).with_for_update()
        result_from = await db.execute(stmt_from)
        from_account = result_from.scalar_one_or_none()

        if not from_account:
            raise ValueError("Cuenta de origen no encontrada")

        if from_account.balance_cents < amount_cents:
            raise ValueError("Fondos insuficientes")

        stmt_to = select(Account).where(Account.id == to_account_id).with_for_update()
        result_to = await db.execute(stmt_to)
        to_account = result_to.scalar_one_or_none()

        if not to_account:
            raise ValueError("Cuenta de destino no encontrada")

        from_account.balance_cents -= amount_cents
        to_account.balance_cents += amount_cents

        new_transaction = Transaction(
            from_account_id=from_account_id,
            to_account_id=to_account_id,
            amount_cents=amount_cents
        )
        db.add(new_transaction)

        await db.commit()
        await db.refresh(new_transaction)

        return new_transaction

    except ValueError:
        # Hacemos rollback explícito en caso de validaciones de negocio fallidas
        await db.rollback()
        raise
    except Exception as e:
        # Hacemos rollback explícito para cualquier otro error inesperado
        await db.rollback()
        raise ValueError("Error interno procesando la transacción")
