from fastapi import APIRouter

from src.client import client

router = APIRouter()

@router.get("/")
async def read_root():
    doc = None

    try:
        db = client['pdf-doc']
        collection = db['users']
        doc = await collection.find_one()
        print(doc)
    except Exception as e:
        print(e)

    return {"Hello": "World",
        "Doc": doc}
