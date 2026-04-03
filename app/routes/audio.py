from fastapi import APIRouter, UploadFile, File, HTTPException
from app.utils.response_schema import AnalysisResponse
from app.utils.file_utils import save_upload, delete_file
from app.services.audio_service import analyze_audio

router = APIRouter()

ALLOWED_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav",
    "audio/x-wav", "audio/wave", "audio/ogg",
    "audio/flac", "audio/mp4", "audio/x-m4a"
}

@router.post("/audio", response_model=AnalysisResponse)
async def analyze_audio_endpoint(file: UploadFile = File(...)):

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: WAV, MP3, OGG, FLAC"
        )

    file_path = await save_upload(file)

    try:
        result = analyze_audio(file_path)

        if result["label"] == "ERROR":
            raise HTTPException(
                status_code=500,
                detail=result["explanation"]
            )

        return AnalysisResponse(
            status="success",
            media_type="audio",
            label=result["label"],
            confidence=result["confidence"],
            explanation=result["explanation"],
            metadata=result.get("metadata", {})
        )

    finally:
        delete_file(file_path)