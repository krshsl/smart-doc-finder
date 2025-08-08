from datetime import datetime, timezone, timedelta
from typing import Union, Optional
from os import getenv

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from pydantic import BaseModel

from src.models import JWTToken, User

ACCESS_TOKEN_EXPIRE_MINUTES = 24*30*60 # 1 month/30 days
security = HTTPBearer(auto_error=False)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def _get_password_hash(password):
    return pwd_context.hash(password)

async def _create_access_token(user: User, expires_delta: Union[timedelta, None] = None):
    to_encode = user._to_dict()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, getenv("SECRET_KEY"), getenv("ALGORITHM"))

    oldest_token = await JWTToken.find_one(JWTToken.user == user, sort=[("created_at", 1)])
    token_count = await JWTToken.find(JWTToken.user == user).count()
    if token_count >= 10 and oldest_token: # Max sessions per user is 10
        await oldest_token.delete()

    await JWTToken.create(user=user, token=encoded_jwt, expires_in=ACCESS_TOKEN_EXPIRE_MINUTES)
    return encoded_jwt

async def _authenticate_user(username: str, password: str) -> User | None:
    user = await User.find_one(User.username == username)
    if user is None:
        return None
    if not _verify_password(password, user.password):
        return None

    return user

async def verify_access_token(
    credentials: Optional[HTTPAuthorizationCredentials],
    required: bool = True
):
    if not credentials:
        if required:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

        return None

    token = credentials.credentials
    token_doc = await JWTToken.find_one(JWTToken.token == token, JWTToken.revoked == False)

    if not token_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if token_doc.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    return token_doc

async def verify_access_token_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
):
    return await verify_access_token(credentials=credentials, required=False)
