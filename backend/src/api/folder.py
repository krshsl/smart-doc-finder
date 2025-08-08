from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, constr
from bson import ObjectId

import src.utils.auth as auth
from src.models.user import DEFAULT_FOLDER
from src.models.folder import Folder, FOLDER_SIZE

router = APIRouter()

class FolderCreateRequest(BaseModel):
    name: constr(min_length=1)
    parent_folder_id: str | None = None

@router.post("/folders", status_code=status.HTTP_201_CREATED)
async def add_folder(
    data: FolderCreateRequest,
    token=Depends(auth.verify_access_token)
):
    token_data, current_user = token
    if data.parent_folder_id:
        parent = await Folder.get(data.parent_folder_id)
    else:
        parent = await Folder.find_one(Folder.name == DEFAULT_FOLDER, Folder.parent == None, Folder.owner == current_user.id)

    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent Folder not found")

    new_usage = current_user.used_storage + FOLDER_SIZE
    if new_usage > current_user.storage_quota:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Storage quota exceeded")

    new_folder = Folder(
        name=data.name,
        owner=current_user,
        parent=parent
    )

    await new_folder.insert()
    current_user.used_storage = new_usage
    await current_user.save()

    return {"message": "Folder has been created successfully", "folder_id": str(new_folder.id)}

@router.get("/folders/{folder_id}", status_code=status.HTTP_200_OK)
async def get_folder_contents(
    folder_id: str,
    token=Depends(auth.verify_access_token)
):
    token_data, current_user = token
    folder = await Folder.get(ObjectId(folder_id))
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    if folder.owner.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return await folder._to_dict(include_refs=True)

@router.delete("/folders/{folder_id}", status_code=status.HTTP_200_OK)
async def delete_folder(
    folder_id: str,
    token=Depends(auth.verify_access_token)
):
    token_data, current_user = token
    folder = await Folder.get(ObjectId(folder_id))
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")

    if folder.owner.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    try:
        await folder.delete()
    except Exception:
        raise HTTPException(status_code=500, detail="Error deleting folder from storage")

    return {"message": "Folder and all associated contents have been successfully deleted"}
