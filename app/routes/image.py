from fastapi import APIRouter, UploadFile, File, HTTPException
from app.utils.response_schema import AnalysisResponse
from app.utils.file_utils import save_upload, delete_file
from app.services.image_service import analyze_image

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg", "image/png",
    "image/webp", "image/jpg"
}

@router.post("/image", response_model=AnalysisResponse)
async def analyze_image_endpoint(file: UploadFile = File(...)):

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: JPEG, PNG, WEBP"
        )

    file_path = await save_upload(file)

    try:
        result = analyze_image(file_path)

        if result["label"] == "ERROR":
            raise HTTPException(
                status_code=500,
                detail=result["explanation"]
            )

        return AnalysisResponse(
            status="success",
            media_type="image",
            label=result["label"],
            confidence=result["confidence"],
            explanation=result["explanation"],
            heatmap_url=result.get("heatmap_url"),
            metadata=result.get("metadata", {})
        )

    finally:
        delete_file(file_path)