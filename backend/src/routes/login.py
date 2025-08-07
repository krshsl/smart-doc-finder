from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from src.utils.auth import Token, _authenticate_user, _create_access_token, verify_access_token

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = _authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _create_access_token(user)

@router.get("/logout")
async def logout(token_data=Depends(verify_access_token)):
    await token_data.delete()
    return {"message": "Successfully logged out"}
