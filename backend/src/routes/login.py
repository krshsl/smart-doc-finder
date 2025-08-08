from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field, ValidationError

import src.utils.auth as auth
from src.models.user import User

router = APIRouter()

class UserCreateRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = Field(default="user", pattern="^(admin|user|moderator)$")

@router.post("/create_user", status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreateRequest,
    token_doc=Depends(auth.verify_access_token_optional)
):
    current_user_role = None
    if token_doc:
        current_user = await User.find_one(User.username == token_doc.sub)
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
    return {"message": "User created successfully"}

@router.post("/login", response_model=auth.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await auth._authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_str = await auth._create_access_token(user)
    return {"access_token": token_str, "token_type": "bearer"}

@router.get("/logout", status_code=status.HTTP_200_OK)
async def logout(token_data=Depends(auth.verify_access_token)):
    await token_data.delete()
    return {"message": "Successfully logged out"}
