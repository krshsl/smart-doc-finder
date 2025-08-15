from importlib import import_module
from os import listdir, path

package_dir = path.dirname(__file__)


def load_middlewares():
    middlewares = []
    for filename in listdir(package_dir):
        if filename.endswith(".py") and filename != "__init__.py":
            module_name = f"{__name__}.{filename[:-3]}"
            module = import_module(module_name)
            if hasattr(module, "middlewares"):
                middlewares.extend(module.middlewares)
            else:
                for attr in dir(module):
                    obj = getattr(module, attr)
                    if callable(obj) and getattr(obj, "_is_middleware", False):
                        middlewares.append(obj)
    return middlewares
