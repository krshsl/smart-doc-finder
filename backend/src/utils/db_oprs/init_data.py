import csv
import hashlib
import random
from io import BytesIO, StringIO

from faker import Faker
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas


async def create_guest_data():
    from src.client import get_fs, get_redis_client
    from src.models import File, Folder, User
    from src.rag.ingest import ingest_file_to_redis

    guest_user = await User.find_one(User.role == "guest")
    if not guest_user:
        return

    TARGET_SIZE_BYTES = 25 * 1024 * 1024
    current_size = guest_user.used_storage or 0

    if current_size >= TARGET_SIZE_BYTES:
        print("Guest user already has sufficient data. Skipping population.")
        return

    remaining_size_to_add = TARGET_SIZE_BYTES - current_size
    total_size_generated = 0

    fs = get_fs()
    r_client = get_redis_client()
    fake = Faker()

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
        "UserData": {
            "folder_name": "User Data Exports",
            "title_prefix": "Export of",
        },
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

    def generate_pdf_content(text_content: str) -> bytes:
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
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["user_id", "name", "email", "city", "job_title"])
        for _ in range(random.randint(500, 2000)):
            writer.writerow(
                [fake.uuid4(), fake.name(), fake.email(), fake.city(), fake.job()]
            )
        return output.getvalue()

    print(
        f"Populating guest account. Current size: {current_size / (1024 * 1024):.2f} MB. Target: {TARGET_SIZE_BYTES / (1024 * 1024):.2f} MB."
    )

    while total_size_generated < remaining_size_to_add:
        theme = random.choice(list(THEMATIC_CONTENT.keys()))
        theme_data = THEMATIC_CONTENT[theme]
        target_folder = folder_map[theme]

        if theme == "UserData":
            file_type = "csv"
        else:
            file_type = random.choice(["txt", "pdf"])

        title = f"{theme_data['title_prefix']} {fake.bs().replace(' ', '_')}"
        file_name = f"{title.replace(' ', '_')}_{random.randint(100, 999)}.{file_type}"

        contents = b""
        mime_type = ""

        if file_type == "csv":
            text_content = generate_csv_content()
            contents = text_content.encode("utf-8")
            mime_type = "text/csv"
        else:
            text_content = f"{title.upper()}\n\n{fake.text(max_nb_chars=random.randint(15000, 50000))}"
            if file_type == "pdf":
                contents = generate_pdf_content(text_content)
                mime_type = "application/pdf"
            else:
                contents = text_content.encode("utf-8")
                mime_type = "text/plain"

        file_size = len(contents)
        if total_size_generated + file_size > remaining_size_to_add:
            if remaining_size_to_add - total_size_generated < 100 * 1024:
                break
            continue

        content_hash = hashlib.sha256(contents).hexdigest()
        gridfs_id = await fs.upload_from_stream(
            file_name,
            BytesIO(contents),
            metadata={"contentType": mime_type},
        )
        new_file = File(
            file_name=file_name,
            file_type=mime_type,
            file_size=file_size,
            owner=guest_user,
            folder=target_folder,
            gridfs_id=str(gridfs_id),
            content_hash=content_hash,
        )
        await new_file.insert()
        await ingest_file_to_redis(r_client, new_file, contents)
        total_size_generated += file_size

    if total_size_generated > 0:
        guest_user.used_storage = current_size + total_size_generated
        await guest_user.save()
        print(
            f"Guest user data populated successfully. Added: {total_size_generated / (1024 * 1024):.2f} MB. New total: {guest_user.used_storage / (1024 * 1024):.2f} MB"
        )
