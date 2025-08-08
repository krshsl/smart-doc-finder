from asyncio import gather
from beanie import Link, Delete, before_event
from typing import Optional, List

from .baseDocument import BaseDocument
from .user import User

FOLDER_SIZE = 512

class Folder(BaseDocument):
    name: str
    owner: Link[User]
    parent: Optional[Link["Folder"]] = None
    shared_with: List[Link[User]] = []
    folder_size: int = FOLDER_SIZE

    async def calculate_total_size(self) -> int:
        from .file import File

        total_size = self.folder_size
        total_size += await File.find(File.folder == self.id).sum(File.file_size)
        child_folders = await Folder.find(Folder.parent == self.id).to_list()
        for child in child_folders:
            total_size += await child.calculate_total_size()

        return total_size

    @before_event(Delete)
    async def _cascade_delete(self):
        from .file import File

        await Folder.delete_many(Folder.parent == self.id)
        await File.delete_many(File.folder == self.id)

    async def _to_dict(self, include_refs = False, include_children = False):
        folders = {
            "id": str(self.id),
            "name": self.name,
            "folder_size": self.folder_size
        }

        if include_refs:
            from .file import File

            files = await File.find(File.folder == self.id).to_list()
            sub_folders = await Folder.find(Folder.parent == self.id).to_list()
            files_list = await gather(*(f._to_dict() for f in files))
            sub_folders_list = await gather(*(s._to_dict(include_refs=include_children, include_children=include_children) for s in sub_folders))
            folders["files"] = files_list
            folders["sub_folders"] = sub_folders_list

        return folders
