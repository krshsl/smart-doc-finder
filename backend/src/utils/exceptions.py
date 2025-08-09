from fastapi import HTTPException, status


def raise_access_denied():
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def raise_not_found(resource_name: str):
    message = f"{resource_name.capitalize()} not found"
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)


def raise_storage_exceeded():
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Storage quota exceeded"
    )
