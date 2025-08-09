from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field, ValidationError, validator
from bson import ObjectId

import src.utils.auth as auth
from src.models import User
from src.utils.constants import USER_LIMIT

router = APIRouter()

class UserCreateRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = Field(default="user", pattern="^(admin|user|moderator)$")

    @validator('username')
    def username_min_length(cls, v):
        if len(v) < 4:
            raise ValueError('Username should have at least 4 characters')
        return v

    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password should have at least 8 characters')
        return v

@router.post("/user", status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreateRequest,
    token=Depends(auth.verify_access_token_optional)
):
    token_data, current_user = token if token else None, None
    count = await User.count()
    if count == USER_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Max user limit reached."
        )

    current_user_role = None
    if current_user:
        current_user_role = current_user.role

    role = "user"
    if data.role:
        role = data.role

    if role in ("admin", "moderator") and current_user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create admin or moderator accounts."
        )

    existing_user = await User.find_one(User.username == data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken."
        )

    existing_user = await User.find_one(User.email == data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already taken."
        )

    hashed_password = auth._get_password_hash(data.password)

    try:
        new_user = User(
            email=data.email,
            username=data.username,
            password=hashed_password,
            role=role
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.errors()
        )

    await new_user.insert()
    return {"message": "User has been created successfully"}

@router.post("/user/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: str,
    token=Depends(auth.verify_access_token)
):
    token_data, current_user = token
    user = await User.get(ObjectId(user_id))

    if current_user.role != "admin" and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete other accounts."
        )

    try:
        await user.delete()
    except Exception as e:
        from src import logger

        logger.error(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error while deleting current user")

    return {"message": "User and all associated data have been successfully deleted"}
