from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.db.database import init_db

# Import routers
from app.routes.image import router as image_router
from app.routes.video import router as video_router
from app.routes.audio import router as audio_router
from app.routes.report import router as report_router
from app.routes.verify import router as verify_router

# Create FastAPI app
app = FastAPI(
    title="Deepfake Detection API",
    description="AI-powered media authentication system",
    version="1.0.0"
)


@app.on_event("startup")
def on_startup():
    init_db()

# Enable CORS (so frontend can call our API from any origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve heatmap images as static files
os.makedirs("outputs", exist_ok=True)
os.makedirs("temp", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Register routes
app.include_router(image_router, prefix="/analyze", tags=["Image Analysis"])
app.include_router(video_router, prefix="/analyze", tags=["Video Analysis"])
app.include_router(audio_router, prefix="/analyze", tags=["Audio Analysis"])
app.include_router(report_router, tags=["Report"])
app.include_router(verify_router, tags=["Verification"])

@app.get("/")
def root():
    return {"message": "Deepfake Detection API is running!"}

@app.get("/health")
def health():
    return {"status": "healthy", "version": "1.0.0"}