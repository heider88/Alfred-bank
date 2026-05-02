import asyncio
import os
from sqlalchemy import select
from core.database import async_session_maker
from models.domain import Account
from core.security import create_access_token
import httpx

async def main():
    async with async_session_maker() as session:
        # Get first account
        result = await session.execute(select(Account).limit(1))
        account = result.scalar_one_or_none()
        if not account:
            print("No accounts found")
            return
            
        token = create_access_token(str(account.id))
        print(f"Using account {account.id}")
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "http://127.0.0.1:8000/api/v1/chat",
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "account_id": str(account.id),
                    "message": "Hola"
                }
            )
            print("STATUS:", resp.status_code)
            print("BODY:", resp.text)

asyncio.run(main())
