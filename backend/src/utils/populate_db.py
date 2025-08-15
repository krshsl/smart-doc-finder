from .db_oprs.init_data import create_guest_data
from .db_oprs.init_users import create_initial_users


async def populate_db(app_vars):
    import logging

    logger = logging.getLogger("uvicorn")
    logger.info("DB population started")
    await create_initial_users(app_vars)
    await create_guest_data()
    logger.info("DB population successfull")
