from datetime import datetime, timezone, timedelta
from typing import Union
from os import getenv

import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from pydantic import BaseModel

from src.models import JWTToken, User

ACCESS_TOKEN_EXPIRE_MINUTES = 24*30*60 # 1 month/30 days
security = HTTPBearer()

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

def _create_access_token(user: User, expires_delta: Union[timedelta, None] = None):
    to_encode = user._to_dict()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, getenv("SECRET_KEY"), getenv("ALGORITHM"))
    JWTToken.create(user=user, token=encoded_jwt, expires_in=ACCESS_TOKEN_EXPIRE_MINUTES)
    return encoded_jwt

async def _authenticate_user(username: str, password: str):
    user = await User.find_one(User.username == username)
    if user is None:
        return False
    if not _verify_password(password, user.password):
        return False

    return user

async def verify_access_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    token = credentials.credentials
    token_doc = await JWTToken.find_one(JWTToken.token == token, JWTToken.revoked == False)
    if not token_doc:
        raise HTTPException(status_code=401, detail="Invalid token")
    if token_doc.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Token expired")
    return token_doc
