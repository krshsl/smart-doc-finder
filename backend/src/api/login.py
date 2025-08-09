from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

import src.utils.auth as auth

router = APIRouter()


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


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(token=Depends(auth.verify_access_token)):
    token_data, current_user = token
    await token_data.delete()
    return {"message": "Successfully logged out"}
