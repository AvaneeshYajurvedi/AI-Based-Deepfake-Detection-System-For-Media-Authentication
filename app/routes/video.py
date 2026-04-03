from fastapi import APIRouter, UploadFile, File, HTTPException
from app.utils.response_schema import AnalysisResponse
from app.utils.file_utils import save_upload, delete_file
from app.services.video_service import analyze_video

router = APIRouter()

ALLOWED_TYPES = {
    "video/mp4", "video/avi", "video/quicktime",
    "video/x-msvideo", "video/webm", "video/x-matroska"
}

@router.post("/video", response_model=AnalysisResponse)
async def analyze_video_endpoint(file: UploadFile = File(...)):

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: MP4, AVI, MOV, WEBM"
        )

    file_path = await save_upload(file)

    try:
        result = analyze_video(file_path)

        if result["label"] == "ERROR":
            raise HTTPException(
                status_code=422,
                detail=result["explanation"]
            )

        return AnalysisResponse(
            status="success",
            media_type="video",
            label=result["label"],
            confidence=result["confidence"],
            explanation=result["explanation"],
            frame_scores=result.get("frame_scores"),
            suspicious_frames=result.get("suspicious_frames"),
            metadata=result.get("metadata", {})
        )

    finally:
        delete_file(file_path)