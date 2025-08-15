import src.utils.auth as auth


async def create_initial_users(app_vars):
    from src.models.user import User

    guest_exists = await User.find_one(User.username == "guest")

    if not guest_exists:
        guest = User(
            email="guest@example.com",
            username="guest",
            password=auth._get_password_hash("password"),
            role="guest",
        )
        await guest.insert()
