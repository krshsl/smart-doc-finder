from bson import ObjectId
from bson.dbref import DBRef
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, constr

import src.utils.auth as auth
from src.models import Folder, User
from src.utils.constants import DEFAULT_FOLDER, META_DATA_SIZE, STORAGE_QUOTA

router = APIRouter()


class FolderCreateRequest(BaseModel):
    name: constr(min_length=1)
    parent_folder_id: str | None = None


@router.post("/folder", status_code=status.HTTP_201_CREATED)
async def add_folder(
    data: FolderCreateRequest, token=Depends(auth.verify_access_token_exclude_guests)
):
    token_data, current_user = token
    if data.parent_folder_id:
        parent = await Folder.get(data.parent_folder_id)
    else:
        parent = await Folder.find_one(
            Folder.name == DEFAULT_FOLDER,
            Folder.owner == DBRef(User.__name__, current_user.id),
            Folder.parent is None,
        )

    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Parent Folder not found"
        )

    user = await parent.owner.fetch()
    if not user or user.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    new_usage = current_user.used_storage + META_DATA_SIZE
    if new_usage > STORAGE_QUOTA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Storage quota exceeded"
        )

    new_folder = Folder(name=data.name, owner=current_user, parent=parent)

    await new_folder.insert()
    current_user.used_storage = new_usage
    await current_user.save()

    return {
        "message": "Folder has been created successfully",
        "folder_id": str(new_folder.id),
    }


class RenameRequest(BaseModel):
    name: constr(min_length=1)


@router.post("/folder/edit/{folder_id}", status_code=status.HTTP_200_OK)
async def edit_file(
    folder_id: str,
    payload: RenameRequest,
    token=Depends(auth.verify_access_token_exclude_guests),
):
    token_data, current_user = token
    folder = await Folder.get(ObjectId(folder_id))
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found"
        )

    owner = await folder.owner.fetch()
    if owner.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    try:
        folder.name = payload.name
        await folder.save()

        return {"message": "Folder has been renamed successfully"}
    except Exception as e:
        from src import logger

        logger.error(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while renaming file",
        )


@router.get("/folder", status_code=status.HTTP_200_OK)
async def get_default_folder(token=Depends(auth.verify_access_token)):
    token_data, current_user = token
    folder = await Folder.find_one(
        Folder.name == DEFAULT_FOLDER,
        Folder.owner == DBRef(User.__name__, current_user.id),
        Folder.parent is None,
    )
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found"
        )

    owner = await folder.owner.fetch()
    if owner.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    return await folder._to_dict(include_refs=True)


@router.get("/folder/{folder_id}", status_code=status.HTTP_200_OK)
async def get_folder_contents(folder_id: str, token=Depends(auth.verify_access_token)):
    token_data, current_user = token
    folder = await Folder.get(ObjectId(folder_id))
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found"
        )

    owner = await folder.owner.fetch()
    if owner.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    return await folder._to_dict(include_refs=True, include_parents=True)


@router.delete("/folder/{folder_id}", status_code=status.HTTP_200_OK)
async def delete_folder(
    folder_id: str, token=Depends(auth.verify_access_token_exclude_guests)
):
    token_data, current_user = token
    folder = await Folder.get(ObjectId(folder_id))
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found"
        )

    owner = await folder.owner.fetch()
    if owner.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    if folder.name == DEFAULT_FOLDER and folder.parent is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    try:
        await folder.delete()
    except Exception as e:
        from src import logger

        logger.error(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting folder from storage",
        )

    return {
        "message": "Folder and all associated contents have been successfully deleted"
    }
