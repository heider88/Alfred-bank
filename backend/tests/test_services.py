import pytest
import uuid
from services.transaction_service import execute_transfer
from models.domain import Account
from tests.conftest import TestingSessionLocal
from core.security import get_password_hash

@pytest.mark.asyncio
async def test_successful_transfer(setup_db, db_session):
    """Test que una transferencia válida mueve fondos correctamente y crea registro"""
    # 1. Setup cuentas
    acc1 = Account(owner_name="Origen", email="origen@test.com", hashed_password="xxx", balance_cents=1000)
    acc2 = Account(owner_name="Destino", email="destino@test.com", hashed_password="xxx", balance_cents=500)
    db_session.add_all([acc1, acc2])
    await db_session.commit()
    await db_session.refresh(acc1)
    await db_session.refresh(acc2)
    
    # 2. Ejecutar Transferencia (200 centavos)
    tx = await execute_transfer(db_session, acc1.id, acc2.id, 200, "Prueba test")
    
    # 3. Asserts de negocio
    assert tx.amount_cents == 200
    assert tx.description == "Prueba test"
    
    await db_session.refresh(acc1)
    await db_session.refresh(acc2)
    
    # Origen tenía 1000, envió 200 -> quedan 800
    assert acc1.balance_cents == 800
    # Destino tenía 500, recibió 200 -> quedan 700
    assert acc2.balance_cents == 700

@pytest.mark.asyncio
async def test_transfer_insufficient_funds(setup_db, db_session):
    """Test que no permite transferir más de lo que se tiene"""
    acc1 = Account(owner_name="Pobre", email="pobre@test.com", hashed_password="xxx", balance_cents=100)
    acc2 = Account(owner_name="Rico", email="rico@test.com", hashed_password="xxx", balance_cents=5000)
    db_session.add_all([acc1, acc2])
    await db_session.commit()
    await db_session.refresh(acc1)
    await db_session.refresh(acc2)
    
    # Intentar transferir 200 cuando solo se tiene 100
    with pytest.raises(ValueError, match="Fondos insuficientes"):
        await execute_transfer(db_session, acc1.id, acc2.id, 200)

@pytest.mark.asyncio
async def test_transfer_negative_amount(setup_db, db_session):
    """Test que no permite transferir montos negativos (Robo de dinero inverso)"""
    acc1 = Account(owner_name="Hacker", email="hacker@test.com", hashed_password="xxx", balance_cents=1000)
    acc2 = Account(owner_name="Victima", email="victima@test.com", hashed_password="xxx", balance_cents=5000)
    db_session.add_all([acc1, acc2])
    await db_session.commit()
    await db_session.refresh(acc1)
    await db_session.refresh(acc2)
    
    with pytest.raises(ValueError, match="mayor a 0"):
        await execute_transfer(db_session, acc1.id, acc2.id, -500)
