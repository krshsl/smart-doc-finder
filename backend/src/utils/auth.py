from datetime import datetime, timedelta, timezone
from os import getenv
from typing import Optional, Tuple, Union

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from pydantic import BaseModel
from src.models import JWTToken, User

MAX_TOKEN_LIMIT = 10
ACCESS_TOKEN_EXPIRE_MINUTES = 12 * 60  # 12 hours
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


async def _create_access_token(
    user: User, expires_delta: Union[timedelta, None] = None
):
    to_encode = await user._to_dict()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, getenv("SECRET_KEY"), getenv("ALGORITHM"))

    oldest_token = await JWTToken.find_one(
        JWTToken.user == user, sort=[("created_at", 1)]
    )
    token_count = await JWTToken.find(JWTToken.user == user).count()
    if token_count >= MAX_TOKEN_LIMIT and oldest_token:
        await oldest_token.delete()

    await JWTToken.create(
        user=user, token=encoded_jwt, expires_in=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return encoded_jwt


async def _authenticate_user(username: str, password: str) -> User | None:
    user = await User.find_one(User.username == username)
    if user is None:
        return None

    if not _verify_password(password, user.password):
        return None

    return user


async def verify_access_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
    required: bool = True,
) -> Optional[Tuple[JWTToken, User]]:
    if not credentials:
        if required:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token"
            )

        return None

    token = credentials.credentials
    token_data = await JWTToken.find_one(JWTToken.token == token)

    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    expires_at = token_data.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        )

    current_user = await token_data.user.fetch()
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )

    return token_data, current_user


async def verify_access_token_exclude_guests(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> Optional[Tuple[JWTToken, User]]:
    token_data, current_user = await verify_access_token(credentials=credentials)

    if not current_user or current_user.role == ["guest"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
        )

    return token_data, current_user


async def verify_access_token_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
):
    return await verify_access_token(credentials=credentials, required=False)
