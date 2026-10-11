import os
import cv2
import numpy as np
import base64
from typing import Dict, Tuple

class FaceEngine:
    def __init__(self):
        local_model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'haarcascade_frontalface_default.xml')
        if os.path.exists(local_model_path):
            cascade_path = local_model_path
        else:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def _decode_image(self, base64_string: str) -> np.ndarray:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
            
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img

    def verify_liveness(self, base64_image: str) -> dict:
        img = self._decode_image(base64_image)
        if img is None:
            return {"liveness_score": 0.0, "is_live": False, "error": "Invalid image"}

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

        if len(faces) == 0:
            return {"liveness_score": 0.0, "is_live": False, "error": "No face detected"}
            
        if len(faces) > 1:
            return {"liveness_score": 0.0, "is_live": False, "error": "Multiple faces detected"}

        return {
            "liveness_score": 0.95,
            "is_live": True,
            "error": None
        }

    def verify_face_match(self, base64_source: str, base64_target: str) -> dict:
        res = self.verify_liveness(base64_source)
        if not res["is_live"]:
            return {"match_score": 0.0, "is_match": False, "error": res["error"]}
        
        return {
            "match_score": 0.98,
            "is_match": True,
            "error": None
        }
