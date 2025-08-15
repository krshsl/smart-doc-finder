import logging
import urllib.parse
from sys import exit
from types import SimpleNamespace

from httpx import AsyncClient, DigestAuth, RequestError

from src.models import File
from src.rag import EMB_DIM, INDEX_NAME


async def init_search_index(env: SimpleNamespace):
    logger = logging.getLogger("uvicorn")
    collection_name = File.__name__

    update_body = {
        "definition": {
            "mappings": {
                "dynamic": False,
                "fields": {
                    "owner": {"type": "document", "dynamic": True},
                    "embedding": {
                        "type": "knnVector",
                        "dimensions": EMB_DIM,
                        "similarity": "euclidean",
                    },
                },
            }
        }
    }

    create_body = {
        "name": INDEX_NAME,
        "database": env.DB_NAME,
        "collectionName": collection_name,
        "definition": update_body["definition"],
    }

    headers = {
        "Accept": "application/vnd.atlas.2024-05-30+json",
        "Content-Type": "application/json",
    }

    safe_group_id = urllib.parse.quote(env.GROUP_ID.strip())
    safe_cluster_name = urllib.parse.quote(env.CLUSTER_NAME.strip())
    safe_db_name = urllib.parse.quote(env.DB_NAME.strip())
    safe_collection_name = urllib.parse.quote(collection_name)
    safe_index_name = urllib.parse.quote(INDEX_NAME)

    base_url = "https://cloud.mongodb.com/api/atlas/v2"

    general_endpoint = (
        f"{base_url}/groups/{safe_group_id}/clusters/{safe_cluster_name}/search/indexes"
    )
    specific_endpoint = (
        f"{general_endpoint}/{safe_db_name}/{safe_collection_name}/{safe_index_name}"
    )

    auth = DigestAuth(env.ATLAS_PUBLIC_KEY, env.ATLAS_PRIVATE_KEY)

    async with AsyncClient() as client:
        try:
            response = await client.get(specific_endpoint, auth=auth, headers=headers)

            if response.status_code == 200:
                logger.info(
                    f"Atlas Search index '{INDEX_NAME}' already exists. Updating..."
                )
                update_response = await client.patch(
                    specific_endpoint, auth=auth, json=update_body, headers=headers
                )
                if update_response.status_code in [200, 202]:
                    logger.info(
                        f"Atlas Search index '{INDEX_NAME}' updated successfully."
                    )
                else:
                    logger.error(
                        f"Failed to update Atlas Search index: {update_response.text}"
                    )

            elif response.status_code == 404:
                logger.info(f"Atlas Search index '{INDEX_NAME}' not found. Creating...")
                create_response = await client.post(
                    general_endpoint, auth=auth, json=create_body, headers=headers
                )
                if create_response.status_code in [200, 201]:
                    logger.info(
                        f"Atlas Search index '{INDEX_NAME}' created successfully."
                    )
                else:
                    logger.error(
                        f"Failed to create Atlas Search index: {create_response.text}"
                    )

            else:
                logger.error(f"Error checking Atlas Search index: {response.text}")

        except RequestError as e:
            logger.error(f"HTTP error during Atlas Search index check: {e}")
            exit(1)
