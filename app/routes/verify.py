from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Report
from app.services.hash_service import build_report_hash, compute_file_hash
from app.services.signature_service import verify_report_signature


router = APIRouter()


class VerifyResponse(BaseModel):
    status: str
    report_hash: str


class VerifyFullResponse(BaseModel):
    status: str
    report_hash: str
    hash_match: bool
    signature_valid: bool
    exists_in_db: bool


@router.get("/verify", response_model=VerifyResponse)
def verify_report(report_hash: str, db: Session = Depends(get_db)):
    exists = db.query(Report).filter(Report.report_hash == report_hash).first() is not None
    return VerifyResponse(status="VALID" if exists else "INVALID", report_hash=report_hash)


@router.post("/verify-full", response_model=VerifyFullResponse)
async def verify_report_full(
    file: UploadFile = File(...),
    result: str = Form(...),
    confidence: float = Form(...),
    timestamp: str = Form(...),
    report_hash: str = Form(...),
    digital_signature: str = Form(...),
    db: Session = Depends(get_db),
):
    # Step 1: Recompute hashes from source file + claimed result payload.
    file_bytes = await file.read()
    file_hash = compute_file_hash(file_bytes)
    recomputed_report_hash = build_report_hash(file_hash, result, confidence, timestamp)

    # Step 2: Verify hash consistency, signature integrity, and DB existence.
    hash_match = recomputed_report_hash == report_hash
    signature_valid = verify_report_signature(report_hash, digital_signature)
    exists_in_db = db.query(Report).filter(Report.report_hash == report_hash).first() is not None

    # Step 3: Return tri-state verification verdict.
    if hash_match and signature_valid and exists_in_db:
        status = "AUTHENTIC"
    elif not exists_in_db:
        status = "INVALID"
    else:
        status = "TAMPERED"

    return VerifyFullResponse(
        status=status,
        report_hash=report_hash,
        hash_match=hash_match,
        signature_valid=signature_valid,
        exists_in_db=exists_in_db,
    )
