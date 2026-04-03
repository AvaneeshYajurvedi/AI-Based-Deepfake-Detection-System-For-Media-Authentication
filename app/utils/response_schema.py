from pydantic import BaseModel
from typing import Optional, List

class AnalysisResponse(BaseModel):
    status: str                        # "success" or "error"
    media_type: str                    # "image", "video", "audio"
    label: str                         # "REAL" or "FAKE"
    confidence: float                  # 0.0 to 1.0
    explanation: str                   # Human-readable explanation
    heatmap_url: Optional[str] = None  # Path to heatmap image (images only)
    frame_scores: Optional[List[float]] = None  # Per-frame scores (video only)
    suspicious_frames: Optional[List[int]] = None  # Frame numbers that look fake
    metadata: dict = {}                # filename, size, duration, etc.