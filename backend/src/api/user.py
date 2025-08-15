from os import getenv
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field, field_validator

import src.utils.auth as auth
from src.models import User
from src.utils.exceptions import raise_access_denied, raise_not_found

USER_LIMIT = int(getenv("USER_LIMIT"))
router = APIRouter()


class UserCreateRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = Field(default="user", pattern="^(admin|user|guest)$")

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 4:
            raise ValueError("Username should have at least 4 characters")
        if " " in v:
            raise ValueError("Username cannot contain spaces")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password should have at least 8 characters")
        return v


class UserUpdateRequest(BaseModel):
    email: EmailStr | None = None
    username: str | None = None
    password: str | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str | None) -> str | None:
        if v and len(v) < 4:
            raise ValueError("Username should have at least 4 characters")
        if v and " " in v:
            raise ValueError("Username cannot contain spaces")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str | None) -> str | None:
        if v and len(v) < 8:
            raise ValueError("Password should have at least 8 characters")
        return v


class UsersRequest(BaseModel):
    page: int = 1
    size: int = 10
    q: str = ""


@router.post("/user", status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreateRequest, token=Depends(auth.verify_access_token_optional)
):
    token_data, current_user = token if token else (None, None)
    count = await User.count()
    if count >= USER_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Max user limit reached."
        )

    current_user_role = current_user.role if current_user else None

    if data.role == "admin" and current_user_role != "admin":
        raise_access_denied()

    if await User.find_one(User.username == data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken."
        )

    if await User.find_one(User.email == data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already taken."
        )

    hashed_password = auth._get_password_hash(data.password)

    try:
        new_user = User(
            email=data.email,
            username=data.username,
            password=hashed_password,
            role=data.role,
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=e.errors()
        )

    await new_user.insert()
    return {"message": "User has been created successfully"}


@router.post("/users", status_code=status.HTTP_200_OK)
async def get_users(data: UsersRequest, token=Depends(auth.verify_access_token)):
    token_data, current_user = token
    if current_user.role != "admin":
        raise_access_denied()

    query = {}
    if data.q:
        query["$or"] = [
            {"username": {"$regex": data.q, "$options": "i"}},
            {"email": {"$regex": data.q, "$options": "i"}},
        ]

    total_users = await User.find(query).count()
    users = (
        await User.find(query)
        .skip((data.page - 1) * data.size)
        .limit(data.size)
        .to_list()
    )

    return {
        "items": [await u._to_dict() for u in users],
        "total": total_users,
        "page": data.page,
        "size": data.size,
        "pages": (total_users + data.size - 1) // data.size,
    }


@router.post("/user/{user_id}", status_code=status.HTTP_200_OK)
async def update_user(
    user_id: str,
    data: UserUpdateRequest,
    token=Depends(auth.verify_access_token),
):
    token_data, current_user = token
    user = await User.get(user_id)
    if not user:
        raise_not_found(User.__name__)

    if user.id != current_user.id and current_user.role != "admin":
        raise_access_denied()

    if data.username is not None:
        user.username = data.username

    if data.email is not None:
        user.email = data.email

    if data.password is not None:
        user.password = auth._get_password_hash(data.password)

    await user.save()

    if user.id == current_user.id:
        await token_data.delete()

        token_str = await auth._create_access_token(user)
        return {"access_token": token_str, "token_type": "bearer"}

    return {"message": "User updated successfully"}


@router.delete("/user/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: str, token=Depends(auth.verify_access_token_exclude_guests)
):
    token_data, current_user = token
    user = await User.get(ObjectId(user_id))
    if not user:
        raise_not_found(User.__name__)

    if current_user.role != "admin" and current_user.id != user.id:
        raise_access_denied()

    try:
        await user.delete()
    except Exception as e:
        from src import logger

        logger.error(e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while deleting current user",
        )

    return {"message": "User and all associated data have been successfully deleted"}


class BulkDeleteRequest(BaseModel):
    user_ids: List[str]


@router.delete("/users", status_code=status.HTTP_200_OK)
async def delete_multiple_users(
    data: BulkDeleteRequest, token=Depends(auth.verify_access_token)
):
    token_data, current_user = token
    if current_user.role != "admin":
        raise_access_denied()

    users = await User.find(
        {"_id": {"$in": [ObjectId(uid) for uid in data.user_ids]}}
    ).to_list()
    [await u.delete() for u in users]
    return {"message": f"{len(data.user_ids)} users deleted successfully"}
