from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from core.security import verify_password, create_access_token
from models.domain import Account
from schemas.pydantic_schemas import Token
from datetime import timedelta

router = APIRouter(tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # En OAuth2PasswordRequestForm el email viene en el campo 'username'
    stmt = select(Account).where(Account.email == form_data.username)
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()
    
    if not account or not verify_password(form_data.password, account.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = create_access_token(subject=str(account.id))
    return {"access_token": access_token, "token_type": "bearer"}
