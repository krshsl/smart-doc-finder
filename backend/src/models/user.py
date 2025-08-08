from beanie import Insert, Delete, before_event, after_event
from pydantic import EmailStr, Field
from asyncio import gather

from .baseDocument import BaseDocument

DEFAULT_FOLDER = "~"
STORAGE_QUOTA = 32 * 1024 * 1024
USER_LIMIT = 16

class User(BaseDocument):
    email: EmailStr
    username: str
    password: str
    role: str = Field(default="user", pattern="^(admin|user|moderator)$")
    used_storage: int = 0

    class Settings(BaseDocument.Settings):
        indexes = [
            "username"
        ]

    @after_event(Insert)
    async def create_default_folder(self):
        from .folder import Folder

        default_folder = Folder(
            name=DEFAULT_FOLDER,
            owner=self
        )
        await default_folder.insert()

    @before_event(Delete)
    async def _delete_ref_models(self):
        await gather(self._delete_default_folder(), self._delete_tokens())

    async def _delete_tokens(self):
        from .token import JWTToken

        await JWTToken.delete_many(JWTToken.user == self.id)

    async def _delete_default_folder(self):
        from .folder import Folder

        await self.delete_one(Folder.name == DEFAULT_FOLDER, Folder.parent == None, Folder.owner == self.id)

    async def _to_dict(self):
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "role": self.role
        }
