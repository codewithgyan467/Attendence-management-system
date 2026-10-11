from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core.face_engine import FaceEngine

app = FastAPI(
    title="Attendance AI Service",
    description="Microservice for Facial Verification and Liveness Detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

face_engine = FaceEngine()

class EnrollmentRequest(BaseModel):
    student_id: str
    image_base64: str

class VerificationRequest(BaseModel):
    student_id: str
    live_image_base64: str
    reference_image_base64: str  # Normally this is fetched from S3/DB using student_id

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Verification"}

@app.post("/verify/liveness")
def verify_liveness(req: EnrollmentRequest):
    """Verifies that the provided image contains a live human face."""
    result = face_engine.verify_liveness(req.image_base64)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/verify-face")
def verify_face(req: VerificationRequest):
    """
    Compares the newly captured image against the reference profile image.
    Enforces a liveness check first to prevent photo spoofing.
    """
    try:
        # 1. Check Liveness First
        liveness_result = face_engine.verify_liveness(req.live_image_base64)
        if liveness_result.get("error"):
            # Handle specific errors
            err = liveness_result["error"]
            if "No face" in err:
                raise HTTPException(status_code=400, detail="NO_FACE")
            elif "Multiple faces" in err:
                raise HTTPException(status_code=400, detail="MULTIPLE_FACES")
            else:
                raise HTTPException(status_code=400, detail="IMAGE_INVALID")
            
        if not liveness_result["is_live"]:
            return {
                "faceDetected": True,
                "faceCount": 1,
                "faceMatch": False,
                "faceScore": 0.0,
                "liveness": False,
                "livenessScore": liveness_result.get("liveness_score", 0.0)
            }

        # 2. Check Face Match Similarity
        match_result = face_engine.verify_face_match(req.live_image_base64, req.reference_image_base64)
        
        if match_result.get("error"):
            raise HTTPException(status_code=400, detail="IMAGE_INVALID")

        is_match = match_result.get("is_match", False)

        return {
            "faceDetected": True,
            "faceCount": 1,
            "faceMatch": is_match,
            "faceScore": match_result.get("match_score", 0.0),
            "liveness": True,
            "livenessScore": liveness_result.get("liveness_score", 0.0)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="AI_SERVICE_UNAVAILABLE")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
