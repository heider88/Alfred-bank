import asyncio
from dotenv import load_dotenv
load_dotenv(".env")
import os
import traceback

from api.routes import chat_with_alfred
from schemas.pydantic_schemas import ChatRequest
from models.domain import Account, Transaction

class MockAccount(Account):
    def __init__(self):
        self.id = "0000000001"
        self.balance_cents = 10000000

current_account = MockAccount()

class MockResult:
    def scalar_one_or_none(self):
        return current_account

class MockDB:
    async def execute(self, stmt):
        return MockResult()
    def add(self, obj):
        pass
    async def commit(self):
        pass
    async def rollback(self):
        pass

async def mock_get_account_statement(db, account_id):
    return {
        "account_id": account_id,
        "balance_cents": current_account.balance_cents,
        "transactions": []
    }

async def mock_get_pockets(db, account_id):
    return []

import api.routes
api.routes.get_account_statement = mock_get_account_statement
api.routes.get_pockets = mock_get_pockets

async def main():
    payload = ChatRequest(account_id="0000000001", message="Crea un bolsillo para vacaciones con 50000 pesos")
    try:
        res = await chat_with_alfred(payload, db=MockDB(), current_user=current_account)
        print("Success:", res.reply)
    except Exception as e:
        print("ERROR EN CHAT:")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
