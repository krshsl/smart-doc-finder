import os
import importlib
from fastapi import APIRouter

routes = APIRouter()

package_dir = os.path.dirname(__file__)

for filename in os.listdir(package_dir):
    if filename.endswith(".py") and filename != "__init__.py":
        module_name = f"{__name__}.{filename[:-3]}"
        module = importlib.import_module(module_name)

        if hasattr(module, "router"):
            routes.include_router(module.router)
