from asyncio import gather
from beanie import Link, Delete, before_event
from typing import Optional, List
from bson.dbref import DBRef

from src.utils.constants import META_DATA_SIZE
from .baseDocument import BaseDocument
from .user import User

class Folder(BaseDocument):
    name: str
    owner: Link[User]
    parent: Optional[Link["Folder"]] = None
    shared_with: List[Link[User]] = []
    folder_size: int = META_DATA_SIZE

    async def calculate_total_size(self) -> int:
        from .file import File

        total_size = self.folder_size
        total_size += await File.find(File.folder == DBRef(Folder.__name__, self.id)).sum(File.file_size)
        child_folders = await Folder.find(Folder.parent == DBRef(Folder.__name__, self.id)).to_list()
        for child in child_folders:
            total_size += await child.calculate_total_size()

        return total_size

    @before_event(Delete)
    async def _cascade_delete(self):
        from .file import File # cascade delete can only be triggered with a get request??

        files = await File.find(File.folder == DBRef(Folder.__name__, self.id)).to_list()
        await gather(*(f.delete() for f in files))

        subfolders = await Folder.find(Folder.parent == DBRef(Folder.__name__, self.id)).to_list()
        await gather(*(sf.delete() for sf in subfolders))

    async def _to_dict(self, include_refs = False, include_parents = False, include_children = False):
        folders = {
            "id": str(self.id),
            "name": self.name,
            "folder_size": self.folder_size
        }

        if include_refs:
            from .file import File

            files = await File.find(File.folder == DBRef(Folder.__name__, self.id)).to_list()
            sub_folders = await Folder.find(Folder.parent == DBRef(Folder.__name__, self.id)).to_list()
            files_list = await gather(*(f._to_dict() for f in files))
            sub_folders_list = await gather(*(s._to_dict(include_refs=include_children, include_children=include_children) for s in sub_folders))
            folders["files"] = files_list
            folders["sub_folders"] = sub_folders_list

        if include_parents and self.parent:
           parent: Folder = await self.parent.fetch()
           folders["parent"] = await parent._to_dict(include_parents=True)

        return folders
