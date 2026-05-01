from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.pydantic_schemas import (
    AccountCreate, 
    AccountResponse, 
    FundPayload, 
    TransferPayload, 
    StatementResponse,
    TransactionResponse
)

from services.transaction_service import execute_transfer
from services.account_service import create_account, fund_account, get_account_statement

router = APIRouter(tags=["Fintech API"])

@router.post("/accounts/", response_model=AccountResponse, status_code=201)
async def create_new_account(
    payload: AccountCreate, 
    db: AsyncSession = Depends(get_db)
):
    """Crea una nueva cuenta bancaria con saldo inicial en 0."""
    return await create_account(db, payload.owner_name)


@router.post("/accounts/{account_id}/fund", response_model=AccountResponse)
async def add_funds(
    account_id: UUID, 
    payload: FundPayload, 
    db: AsyncSession = Depends(get_db)
):
    """Simula la recarga de saldo a una cuenta existente (Ingreso de capital)."""
    return await fund_account(db, account_id, payload.amount_cents)


@router.post("/transactions/transfer", response_model=TransactionResponse)
async def transfer_funds(
    payload: TransferPayload, 
    db: AsyncSession = Depends(get_db)
):
    """
    Realiza una transferencia segura entre dos cuentas.
    Valida saldos y ejecuta todo en una única transacción con bloqueos por fila.
    """
    return await execute_transfer(
        db=db,
        from_account_id=payload.from_account_id,
        to_account_id=payload.to_account_id,
        amount_cents=payload.amount_cents
    )


@router.get("/accounts/{account_id}/statement", response_model=StatementResponse)
async def get_statement(
    account_id: UUID, 
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene el estado de cuenta de un usuario.
    Devuelve el saldo actual y su historial de transacciones ordenado cronológicamente.
    """
    return await get_account_statement(db, account_id)
