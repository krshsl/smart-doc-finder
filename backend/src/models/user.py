from pydantic import EmailStr, Field

from .baseDocument import BaseDocument

class User(BaseDocument):
    email: EmailStr
    username: str
    password: str
    role: str = Field(default="user", pattern="^(admin|user|moderator)$")

    class Settings(BaseDocument.Settings):
        indexes = [
            "username"
        ]

    def _to_dict(self):
        return {
            "email": self.email,
            "username": self.username,
            "role": self.role
        }
