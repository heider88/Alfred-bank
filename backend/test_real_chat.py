import asyncio
import httpx
import string
import random

def random_email():
    return ''.join(random.choices(string.ascii_lowercase, k=10)) + "@test.com"

async def main():
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Create user
        payload = {
            "owner_name": "Bruce Wayne",
            "email": random_email(),
            "password": "password123"
        }
        res = await client.post("http://127.0.0.1:8000/api/v1/accounts/", json=payload)
        account_id = res.json().get("id")
        
        # Login
        data = {
            "username": payload["email"],
            "password": "password123"
        }
        res = await client.post("http://127.0.0.1:8000/api/v1/auth/login", data=data)
        token = res.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}

        print("--- TEST 1: PREGUNTAR SALDO ---")
        chat_payload = {
            "account_id": account_id,
            "message": "¿Cuál es mi saldo actual y qué bolsillos tengo?"
        }
        res = await client.post("http://127.0.0.1:8000/api/v1/chat", json=chat_payload, headers=headers)
        print("Alfred:", res.json().get("reply"))

        print("\n--- TEST 2: CREAR BOLSILLO ---")
        chat_payload = {
            "account_id": account_id,
            "message": "Crea un bolsillo de 150000 para el viaje a Japón."
        }
        res = await client.post("http://127.0.0.1:8000/api/v1/chat", json=chat_payload, headers=headers)
        print("Alfred:", res.json().get("reply"))
        
        print("\n--- TEST 3: VERIFICAR BOLSILLO EN BD ---")
        res = await client.get("http://127.0.0.1:8000/api/v1/pockets", headers=headers)
        print("Bolsillos:", res.json())
        
        res = await client.get("http://127.0.0.1:8000/api/v1/accounts/me", headers=headers)
        print("Saldo cuenta principal:", res.json().get("balance_cents") / 100)

if __name__ == "__main__":
    asyncio.run(main())
