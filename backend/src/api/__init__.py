from importlib import import_module
from os import listdir, path

from fastapi import APIRouter

routes = APIRouter()

package_dir = path.dirname(__file__)

for filename in listdir(package_dir):
    if filename.endswith(".py") and filename != "__init__.py":
        module_name = f"{__name__}.{filename[:-3]}"
        module = import_module(module_name)

        if hasattr(module, "router"):
            routes.include_router(module.router)
