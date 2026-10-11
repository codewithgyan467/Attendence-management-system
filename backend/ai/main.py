from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from core.face_engine import FaceEngine

app = FastAPI(
    title="AEC MCA Attendance AI Service",
    description="Microservice for Facial Identity Verification and Liveness Anti-Spoofing Detection",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

face_engine = FaceEngine()

class LivenessRequest(BaseModel):
    student_id: str
    image_base64: str

class VerificationRequest(BaseModel):
    student_id: str
    live_image_base64: str
    reference_image_base64: str

class EnrollmentRequest(BaseModel):
    student_id: str
    image_base64: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AEC MCA AI Verification Microservice",
        "version": "2.0.0",
        "models": {
            "face_detector": "HaarCascade FrontalFace",
            "feature_extractor": "Spatial LBP Gradient 512-D",
            "anti_spoofing": "Texture-Spectrum & Frequency PAD"
        }
    }

@app.post("/verify/liveness")
def verify_liveness(req: LivenessRequest):
    """
    Evaluates live capture for face count, blur quality, and presentation attack indicators.
    """
    result = face_engine.verify_liveness(req.image_base64)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/enroll-face")
def enroll_face(req: EnrollmentRequest):
    """
    Extracts and stores a normalized biometric template from an authorized enrollment photo.
    """
    img = face_engine._decode_image(req.image_base64)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid enrollment image data")

    face_roi, assessment = face_engine.detect_and_assess_face(img)
    if assessment.get("error"):
        raise HTTPException(status_code=400, detail=assessment["error"])

    embedding = face_engine.extract_embedding(face_roi)

    return {
        "student_id": req.student_id,
        "template_dimension": len(embedding),
        "embedding_vector": embedding.tolist()[:32],  # Preview sample
        "quality_score": assessment["blur_score"],
        "bbox": assessment["bbox"],
        "status": "ENROLLED"
    }

@app.post("/verify-face")
def verify_face(req: VerificationRequest):
    """
    Executes end-to-end 1:1 facial identity comparison:
    1. Checks liveness on the live capture frame to prevent spoofing.
    2. Extracts 512-D embeddings from both images.
    3. Calculates Cosine Similarity with calibrated institutional thresholds.
    """
    try:
        match_result = face_engine.verify_face_match(
            req.live_image_base64,
            req.reference_image_base64
        )

        if match_result.get("error") and not match_result.get("is_live"):
            raise HTTPException(status_code=400, detail=match_result["error"])

        return {
            "faceDetected": True,
            "faceCount": 1,
            "faceMatch": match_result.get("is_match", False),
            "faceScore": match_result.get("match_score", 0.0),
            "liveness": match_result.get("is_live", False),
            "livenessScore": match_result.get("liveness_score", 0.0),
            "reviewRequired": match_result.get("review_required", False),
            "detail": match_result.get("error")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI_SERVICE_ERROR: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
