from .db_oprs.init_users import create_initial_users


async def populate_db(app_vars):
    await create_initial_users(app_vars)
    # create_task(create_guest_data())
