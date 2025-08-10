from typing import List, Optional

from beanie import Delete, Link, before_event
from bson import ObjectId
from pydantic import Field

from .baseDocument import BaseDocument
from .folder import Folder
from .user import User


class File(BaseDocument):
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    owner: Link[User]
    folder: Optional[Link[Folder]] = None
    tags: List[str] = []
    gridfs_id: Optional[str] = Field(default=None)
    embedding: Optional[List[float]] = Field(default=None)

    @before_event(Delete)
    async def _delete_gridfs_file(self):
        from src.client import get_fs, get_redis_client

        fs = get_fs()
        if self.gridfs_id:
            await fs.delete(ObjectId(self.gridfs_id))

        r = get_redis_client()
        redis_key = f"doc:{self.id}"
        if r.exists(redis_key):
            r.delete(redis_key)

    async def _to_dict(self, include_refs=False):
        file = {
            "id": str(self.id),
            "file_name": self.file_name,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "tags": self.tags,
            "gridfs_id": str(self.gridfs_id),
        }

        if include_refs:
            folder = await self.folder.fetch()
            file["folder"] = await folder._to_dict()

        return file
