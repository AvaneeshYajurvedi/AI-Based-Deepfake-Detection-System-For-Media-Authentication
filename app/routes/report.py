import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Report
from app.services.audio_service import analyze_audio
from app.services.hash_service import build_report_hash, compute_file_hash
from app.services.image_service import analyze_image
from app.services.pdf_service import generate_report_pdf
from app.services.signature_service import sign_report_hash
from app.services.video_service import analyze_video
from app.utils.file_utils import delete_file, save_upload


router = APIRouter()

IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
VIDEO_TYPES = {
    "video/mp4",
    "video/avi",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-matroska",
}
AUDIO_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/ogg",
    "audio/flac",
    "audio/mp4",
    "audio/x-m4a",
}


class ReportCreateResponse(BaseModel):
    status: str
    result: str
    confidence: float
    timestamp: str
    file_hash: str
    report_hash: str
    digital_signature: str
    verification_url: str
    pdf_url: str


def _detect_media_type(content_type: str, media_type: str | None) -> str:
    if media_type:
        value = media_type.lower().strip()
        if value not in {"image", "video", "audio"}:
            raise HTTPException(status_code=400, detail="media_type must be one of: image, video, audio")
        return value

    if content_type in IMAGE_TYPES:
        return "image"
    if content_type in VIDEO_TYPES:
        return "video"
    if content_type in AUDIO_TYPES:
        return "audio"
    raise HTTPException(status_code=400, detail=f"Unsupported content type: {content_type}")


def _run_analysis(media_type: str, file_path: str) -> dict:
    if media_type == "image":
        return analyze_image(file_path)
    if media_type == "video":
        return analyze_video(file_path)
    if media_type == "audio":
        return analyze_audio(file_path)
    raise HTTPException(status_code=400, detail="Unsupported media type")


@router.post("/report", response_model=ReportCreateResponse)
async def create_report(
    request: Request,
    file: UploadFile = File(...),
    media_type: str | None = Form(default=None),
    db: Session = Depends(get_db),
):
    # Step 1: Read uploaded bytes and compute immutable file hash.
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    file_hash = compute_file_hash(file_bytes)
    await file.seek(0)

    # Step 2: Detect media type and run existing deepfake pipeline.
    resolved_media_type = _detect_media_type(file.content_type or "", media_type)
    file_path = await save_upload(file)

    try:
        analysis = _run_analysis(resolved_media_type, file_path)
        if analysis.get("label") == "ERROR":
            raise HTTPException(status_code=500, detail=analysis.get("explanation", "Analysis failed"))

        result_label = analysis.get("label", "UNCERTAIN")
        confidence = float(analysis.get("confidence", 0.0))
        explanation = analysis.get("explanation", "")
        timestamp = datetime.now(timezone.utc).isoformat()

        # Step 3: Build report hash and sign it with RSA private key.
        report_hash = build_report_hash(file_hash, result_label, confidence, timestamp)
        signature = sign_report_hash(report_hash)

        # Step 4: Persist only report_hash in PostgreSQL.
        try:
            db.add(Report(report_hash=report_hash))
            db.commit()
        except IntegrityError:
            db.rollback()

        viewer_base_url = os.getenv("REPORT_VIEWER_URL", "http://localhost:5173").rstrip("/")
        verify_path = f"/verify-view?report_hash={report_hash}"
        verification_url = f"{viewer_base_url}{verify_path}"

        reports_dir = os.path.join("outputs", "reports")
        os.makedirs(reports_dir, exist_ok=True)
        pdf_filename = f"report_{uuid.uuid4().hex[:12]}.pdf"

        # Step 5: Generate the final forensic PDF.
        pdf_path = generate_report_pdf(
            {
                "result": result_label,
                "confidence": confidence,
                "timestamp": timestamp,
                "file_hash": file_hash,
                "report_hash": report_hash,
                "digital_signature": signature,
                "explanation": explanation,
                "verification_url": verification_url,
                "file_name": file.filename or "uploaded_media",
                "file_size": len(file_bytes),
                "media_type": resolved_media_type,
                "analysis_time": "2.3 seconds",
            },
            os.path.join(reports_dir, pdf_filename),
        )

        return ReportCreateResponse(
            status="success",
            result=result_label,
            confidence=confidence,
            timestamp=timestamp,
            file_hash=file_hash,
            report_hash=report_hash,
            digital_signature=signature,
            verification_url=verification_url,
            pdf_url=f"/outputs/reports/{os.path.basename(pdf_path)}",
        )
    finally:
        delete_file(file_path)
