from asyncio import create_task

from .db_oprs.init_data import create_guest_data
from .db_oprs.init_users import create_initial_users


async def populate_db(app_vars):
    await create_initial_users(app_vars)
    create_task(create_guest_data())
