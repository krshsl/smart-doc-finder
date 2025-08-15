import asyncio
import csv
import random
from io import BytesIO, StringIO


async def generate_pdf_content(text_content: str) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.utils import simpleSplit
    from reportlab.pdfgen import canvas

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    p.drawString(50, height - 50, text_content.split("\n")[0])
    lines = simpleSplit(text_content, p._fontname, p._fontsize, width - 100)
    y = height - 70
    for line in lines:
        p.drawString(50, y, line)
        y -= 15
        if y < 50:
            p.showPage()
            y = height - 50
    p.save()
    buffer.seek(0)
    return buffer.getvalue()


def generate_csv_content() -> str:
    from faker import Faker

    fake = Faker()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["user_id", "name", "email", "city", "job_title"])
    for _ in range(random.randint(500, 2000)):
        writer.writerow(
            [fake.uuid4(), fake.name(), fake.email(), fake.city(), fake.job()]
        )
    return output.getvalue()


async def create_and_ingest_file(
    THEMATIC_CONTENT,
    folder_map,
    guest_user,
    fs,
    r_client,
    remaining_size_to_add,
    total_size_generated,
) -> int | None:
    from faker import Faker

    from src.models import File
    from src.rag.ingest import ingest_file_to_redis

    fake = Faker()
    theme = random.choice(list(THEMATIC_CONTENT.keys()))
    theme_data = THEMATIC_CONTENT[theme]
    target_folder = folder_map[theme]
    file_type = "csv" if theme == "UserData" else random.choice(["txt", "pdf"])
    title = f"{theme_data['title_prefix']} {fake.bs().replace(' ', '_')}"
    file_name = f"{title.replace(' ', '_')}_{random.randint(100, 999)}.{file_type}"
    contents, mime_type = b"", ""

    if file_type == "csv":
        text_content = generate_csv_content()
        contents = text_content.encode("utf-8")
        mime_type = "text/csv"
    else:
        text_content = (
            f"{title.upper()}\n\n{fake.text(max_nb_chars=random.randint(15000, 50000))}"
        )
        if file_type == "pdf":
            contents = await generate_pdf_content(text_content)
            mime_type = "application/pdf"
        else:
            contents = text_content.encode("utf-8")
            mime_type = "text/plain"

    file_size = len(contents)
    if total_size_generated + file_size > remaining_size_to_add:
        return None

    gridfs_id = await fs.upload_from_stream(
        file_name, BytesIO(contents), metadata={"contentType": mime_type}
    )
    new_file = File(
        file_name=file_name,
        file_type=mime_type,
        file_size=file_size,
        owner=guest_user,
        folder=target_folder,
        gridfs_id=str(gridfs_id),
    )
    await new_file.insert()
    await ingest_file_to_redis(r_client, fs, str(new_file.id))
    return file_size


async def create_guest_data():
    import logging

    from src.client import get_fs, get_redis_client
    from src.models import Folder, User

    logger = logging.getLogger("uvicorn")
    guest_user = await User.find_one(User.role == "guest")
    if not guest_user:
        return

    TARGET_SIZE_BYTES = 25 * 1024 * 1024
    current_size = guest_user.used_storage or 0

    if current_size >= TARGET_SIZE_BYTES:
        logger.info("Guest user already has sufficient data. Skipping population.")
        return

    remaining_size_to_add = TARGET_SIZE_BYTES - current_size
    fs = get_fs()
    r_client = get_redis_client()

    THEMATIC_CONTENT = {
        "Climate Reports": {
            "folder_name": "Climate Research",
            "title_prefix": "Analysis of",
        },
        "Sports Analytics": {
            "folder_name": "Sports Analytics",
            "title_prefix": "Report on",
        },
        "Movie Scripts": {
            "folder_name": "Screenplays",
            "title_prefix": "Draft Script for",
        },
        "Business Memos": {
            "folder_name": "Corporate Memos",
            "title_prefix": "Memorandum Regarding",
        },
        "UserData": {"folder_name": "User Data Exports", "title_prefix": "Export of"},
    }

    home_folder = await Folder.find_one(
        Folder.name == "Home", Folder.owner.id == guest_user.id
    )

    folder_map = {}
    for theme, data in THEMATIC_CONTENT.items():
        folder = await Folder.find_one(
            Folder.name == data["folder_name"], Folder.owner.id == guest_user.id
        )
        if not folder:
            folder = Folder(
                name=data["folder_name"], owner=guest_user, parent=home_folder
            )
            await folder.insert()
        folder_map[theme] = folder

    logger.info(
        f"Populating guest account. Current size: {current_size / (1024 * 1024):.2f} MB. Target: {TARGET_SIZE_BYTES / (1024 * 1024):.2f} MB."
    )

    total_size_generated = 0
    while total_size_generated < remaining_size_to_add:
        tasks = [
            create_and_ingest_file(
                THEMATIC_CONTENT,
                folder_map,
                guest_user,
                fs,
                r_client,
                remaining_size_to_add,
                total_size_generated,
            )
            for _ in range(8)
        ]
        results = await asyncio.gather(*tasks)
        batch_size_generated = sum(size for size in results if size is not None)
        if batch_size_generated == 0:
            break

        total_size_generated += batch_size_generated
        guest_user.used_storage += batch_size_generated
        await guest_user.save()
        logger.info(
            f"  + Added {batch_size_generated / (1024 * 1024):.2f} MB. New total: {guest_user.used_storage / (1024 * 1024):.2f} MB"
        )

    logger.info(
        f"Guest user data population complete. Final size: {guest_user.used_storage / (1024 * 1024):.2f} MB"
    )
