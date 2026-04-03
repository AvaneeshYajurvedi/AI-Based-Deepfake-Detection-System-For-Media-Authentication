import os
import uuid
import shutil
from fastapi import UploadFile

TEMP_DIR = "temp"
OUTPUT_DIR = "outputs"

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def save_upload(file: UploadFile) -> str:
    """Save uploaded file to temp directory, return file path."""
    ext = os.path.splitext(file.filename)[-1].lower()
    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(TEMP_DIR, unique_name)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path

def delete_file(file_path: str):
    """Delete a file safely."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass