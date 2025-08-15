from beanie import Delete, Insert, after_event, before_event
from bson.dbref import DBRef
from pydantic import EmailStr, Field

from src.utils.constants import DEFAULT_FOLDER, META_DATA_SIZE

from .baseDocument import BaseDocument


class User(BaseDocument):
    email: EmailStr
    username: str
    password: str
    role: str = Field(default="user", pattern="^(admin|user|guest)$")
    used_storage: int = META_DATA_SIZE

    class Settings(BaseDocument.Settings):
        indexes = ["username"]

    @after_event(Insert)
    async def create_default_folder(self):
        from .folder import Folder

        default_folder = Folder(name=DEFAULT_FOLDER, owner=self)
        await default_folder.insert()

    @before_event(Delete)
    async def _delete_ref_models(self):
        await self._delete_tokens()
        await self._delete_default_folder()

    async def _delete_tokens(self):
        from .token import JWTToken

        await JWTToken.find(
            JWTToken.user == DBRef(User.__name__, self.id)
        ).delete_many()

    async def _delete_default_folder(self):
        from .folder import Folder

        folder = await Folder.find_one(
            Folder.name == DEFAULT_FOLDER,
            Folder.parent == None,
            Folder.owner == DBRef(User.__name__, self.id),
        )  # first get the folder, then delete it for the cascade to take effect!
        await folder.delete()

    async def _to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "role": self.role,
        }
