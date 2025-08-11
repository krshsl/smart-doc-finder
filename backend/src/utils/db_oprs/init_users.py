import src.utils.auth as auth


async def create_initial_users(app_vars):
    from src.models.user import User

    admin_exists = await User.find_one(User.username == "admin")
    guest_exists = await User.find_one(User.username == "guest")

    if not admin_exists:
        admin = User(
            email="admin@example.com",
            username="admin",
            password=auth._get_password_hash(app_vars.DB_PASS),
            role="admin",
        )
        await admin.insert()

    if not guest_exists:
        guest = User(
            email="guest@example.com",
            username="guest",
            password=auth._get_password_hash("password"),
            role="guest",
        )
        await guest.insert()
