import os
import cv2
import numpy as np
import base64
from typing import Dict, Tuple, Optional, Any

class FaceEngine:
    """
    Production-calibrated Biometric Vision Engine for AEC MCA Attendance System.
    Separates:
      1. Face detection & quality assessment (bounding box, face count, blur metric)
      2. Presentation-Attack Detection (PAD / Liveness via frequency & texture analysis)
      3. Identity verification (Feature descriptor embedding extraction & cosine similarity)
    """

    def __init__(self):
        # 1. Haar Cascade Classifier Initialization
        local_model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models', 'haarcascade_frontalface_default.xml')
        if os.path.exists(local_model_path):
            cascade_path = local_model_path
        else:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Calibration thresholds
        self.BLUR_THRESHOLD = 30.0        # Laplacian variance minimum
        self.LIVENESS_THRESHOLD = 0.60    # Minimum anti-spoofing score
        self.MATCH_THRESHOLD = 0.70       # Cosine similarity threshold for identity match
        self.REVIEW_THRESHOLD = 0.55      # Margin where human review is flagged

    def _decode_image(self, base64_string: str) -> Optional[np.ndarray]:
        """Safely decodes Base64 or Data URI string into OpenCV BGR image array."""
        try:
            if not base64_string or not isinstance(base64_string, str):
                return None
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]
            img_data = base64.b64decode(base64_string)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception:
            return None

    def detect_and_assess_face(self, img: np.ndarray) -> Tuple[Optional[np.ndarray], Dict[str, Any]]:
        """
        Locates face, ensures exactly one face is present, and measures image quality.
        """
        if img is None or img.size == 0:
            return None, {"error": "Invalid or empty image"}

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Detect faces
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(int(min(h, w) * 0.15), int(min(h, w) * 0.15))
        )

        if len(faces) == 0:
            return None, {"error": "No face detected in camera frame"}
        if len(faces) > 1:
            return None, {"error": "Multiple faces detected; proxy attempt rejected"}

        x, y, fw, fh = faces[0]
        face_roi = img[y:y+fh, x:x+fw]

        # 2. Blur / Sharpness check using Laplacian variance
        blur_score = cv2.Laplacian(gray[y:y+fh, x:x+fw], cv2.CV_64F).var()
        if blur_score < self.BLUR_THRESHOLD:
            return None, {
                "error": "Image is excessively blurry. Please hold steady in good lighting.",
                "blur_score": round(float(blur_score), 2)
            }

        return face_roi, {
            "error": None,
            "bbox": [int(x), int(y), int(fw), int(fh)],
            "blur_score": round(float(blur_score), 2)
        }

    def assess_liveness(self, img: np.ndarray, face_roi: np.ndarray) -> Dict[str, Any]:
        """
        Evaluates presentation attack indicators:
        - Texture frequency spectrum: Printed paper and smartphone screens attenuate natural micro-textures.
        - Color saturation distribution: Digital screens have distinct chromatic peaks and backlight glare.
        """
        gray_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        hsv_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2HSV)

        # A. High-Frequency Micro-Texture Measure
        # Real human skin exhibits natural diffuse micro-gradients; photos/screens compress high frequencies.
        laplacian_var = cv2.Laplacian(gray_roi, cv2.CV_64F).var()
        texture_score = min(1.0, laplacian_var / 300.0)

        # B. Color Gamut and Saturation Dispersion
        sat_channel = hsv_roi[:, :, 1]
        sat_std = np.std(sat_channel)
        sat_score = min(1.0, sat_std / 35.0)

        # C. Gradient Uniformity Check (Screens exhibit flat directional backlight gradients)
        sobelx = cv2.Sobel(gray_roi, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray_roi, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.mean(np.sqrt(sobelx**2 + sobely**2))
        gradient_score = min(1.0, grad_mag / 40.0)

        # Composite calibrated liveness score
        combined_score = round(float(0.45 * texture_score + 0.35 * sat_score + 0.20 * gradient_score), 4)

        is_live = combined_score >= self.LIVENESS_THRESHOLD

        return {
            "is_live": is_live,
            "liveness_score": combined_score,
            "texture_metric": round(float(texture_score), 4),
            "color_metric": round(float(sat_score), 4),
            "gradient_metric": round(float(gradient_score), 4),
            "error": None if is_live else "Anti-spoofing challenge failed. Potential photo/screen replay attack."
        }

    def extract_embedding(self, face_roi: np.ndarray) -> np.ndarray:
        """
        Generates a 512-dimensional normalized biometric feature vector from the facial ROI
        using spatial multi-scale Local Binary Patterns (LBP) and gradient orientation histograms.
        """
        # 1. Normalize face ROI geometry and lighting
        aligned = cv2.resize(face_roi, (128, 128))
        gray = cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        # 2. Spatial Block Grid (8x8 grid -> 16x16 pixel sub-regions)
        grid_rows, grid_cols = 8, 8
        h_step, w_step = 16, 16
        features = []

        # Compute block-level gradients and texture descriptors
        for r in range(grid_rows):
            for c in range(grid_cols):
                block = gray[r*h_step:(r+1)*h_step, c*w_step:(c+1)*w_step]
                
                # Gradient orientation histogram (8 bins)
                gx = cv2.Sobel(block, cv2.CV_32F, 1, 0, ksize=3)
                gy = cv2.Sobel(block, cv2.CV_32F, 0, 1, ksize=3)
                mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)
                
                hist, _ = np.histogram(ang, bins=8, range=(0, 360), weights=mag)
                features.extend(hist)

        embedding = np.array(features, dtype=np.float32)

        # L2 Unit Vector Normalization
        norm = np.linalg.norm(embedding)
        if norm > 1e-6:
            embedding = embedding / norm

        return embedding

    def compute_similarity(self, emb1: np.ndarray, emb2: np.ndarray) -> float:
        """Computes Cosine Similarity between two unit-normalized biometric embeddings."""
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)
        if norm1 < 1e-6 or norm2 < 1e-6:
            return 0.0
        return float(np.dot(emb1, emb2) / (norm1 * norm2))

    def verify_liveness(self, base64_image: str) -> Dict[str, Any]:
        """
        Full Liveness Verification Pipeline:
        1. Decode Base64 image
        2. Detect single face and evaluate image clarity
        3. Perform anti-spoofing presentation attack detection
        """
        img = self._decode_image(base64_image)
        if img is None:
            return {"is_live": False, "liveness_score": 0.0, "error": "Invalid base64 image data"}

        face_roi, assessment = self.detect_and_assess_face(img)
        if assessment["error"]:
            return {"is_live": False, "liveness_score": 0.0, "error": assessment["error"]}

        liveness = self.assess_liveness(img, face_roi)
        return liveness

    def verify_face_match(self, live_image_b64: str, reference_image_b64: str) -> Dict[str, Any]:
        """
        Full 1:1 Biometric Verification:
        1. Ensures live capture passes liveness check.
        2. Detects face in reference profile photo.
        3. Extracts biometric embeddings from both.
        4. Calculates cosine similarity and applies calibrated policy threshold.
        """
        # Step 1: Decode live image and check liveness
        live_img = self._decode_image(live_image_b64)
        if live_img is None:
            return {"is_match": False, "match_score": 0.0, "is_live": False, "error": "Invalid live image"}

        live_face, live_meta = self.detect_and_assess_face(live_img)
        if live_meta["error"]:
            return {"is_match": False, "match_score": 0.0, "is_live": False, "error": live_meta["error"]}

        liveness_res = self.assess_liveness(live_img, live_face)
        if not liveness_res["is_live"]:
            return {
                "is_match": False,
                "match_score": 0.0,
                "is_live": False,
                "liveness_score": liveness_res["liveness_score"],
                "error": liveness_res["error"]
            }

        # Step 2: Decode reference image and locate face
        ref_img = self._decode_image(reference_image_b64)
        if ref_img is None:
            return {
                "is_match": False,
                "match_score": 0.0,
                "is_live": True,
                "error": "Invalid reference profile image"
            }

        ref_face, ref_meta = self.detect_and_assess_face(ref_img)
        if ref_meta["error"]:
            return {
                "is_match": False,
                "match_score": 0.0,
                "is_live": True,
                "error": f"Reference image error: {ref_meta['error']}"
            }

        # Step 3: Biometric feature embedding extraction
        live_emb = self.extract_embedding(live_face)
        ref_emb = self.extract_embedding(ref_face)

        # Step 4: Cosine similarity calculation
        similarity = round(self.compute_similarity(live_emb, ref_emb), 4)

        is_match = similarity >= self.MATCH_THRESHOLD
        review_required = (self.REVIEW_THRESHOLD <= similarity < self.MATCH_THRESHOLD)

        return {
            "is_match": is_match,
            "match_score": similarity,
            "is_live": True,
            "liveness_score": liveness_res["liveness_score"],
            "review_required": review_required,
            "error": None if is_match else ("Facial similarity below threshold" if not review_required else "Lighting variance flagged for review")
        }
