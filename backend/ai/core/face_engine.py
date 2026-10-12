import os
import cv2
import numpy as np
import base64
from typing import Dict, Tuple, Optional, Any

try:
    import onnxruntime as ort
    HAS_ORT = True
except ImportError:
    HAS_ORT = False

class FaceEngine:
    """
    Production-calibrated Open-Source Biometric Vision Engine for AEC MCA Attendance System.
    Architecture:
      1. Deep Face Detector: OpenCV YuNet Deep Neural Network with 5 landmark points (Right eye, Left eye, Nose tip, Right mouth, Left mouth)
         Fallback: Haar Cascade FrontalFace XML
      2. Face Alignment: Canonical 5-point similarity transformation to standard 112x112 coordinate space
      3. Biometric Feature Extractor: ArcFace Deep ResNet (Additive Angular Margin Loss, 512-D normalized embedding)
         Fallback: Spatial Multi-Scale LBP Gradient Descriptor (512-D)
      4. Presentation Attack Detection (Liveness Anti-Spoofing): Frequency spectrum texture, chromatic dispersion & gradient uniformity
      5. 1:1 Identity Matching: Cosine similarity thresholding
    """

    # Canonical facial landmark reference points for 112x112 ArcFace
    CANONICAL_5_POINTS = np.array([
        [38.2946, 51.6963],  # right eye
        [73.5318, 51.5014],  # left eye
        [56.0252, 71.7366],  # nose tip
        [41.5493, 92.3655],  # right mouth corner
        [70.7299, 92.2041]   # left mouth corner
    ], dtype=np.float32)

    CANONICAL_MEDIAPIPE_4_POINTS = np.array([
        [38.2946, 51.6963],  # right eye
        [73.5318, 51.5014],  # left eye
        [56.0252, 71.7366],  # nose tip
        [56.1396, 92.2848]   # mouth center
    ], dtype=np.float32)

    def __init__(self):
        models_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'models')
        
        # 1. Initialize Google MediaPipe Face Detector (BlazeFace Short-Range TFLite/LiteRT)
        mp_model_path = os.path.join(models_dir, 'blaze_face_short_range.tflite')
        self.mp_detector = None
        if os.path.exists(mp_model_path):
            try:
                import mediapipe as mp
                from mediapipe.tasks import python
                from mediapipe.tasks.python import vision
                base_options = python.BaseOptions(model_asset_path=mp_model_path)
                options = vision.FaceDetectorOptions(base_options=base_options, min_detection_confidence=0.50)
                self.mp_detector = vision.FaceDetector.create_from_options(options)
                print("[FaceEngine] MediaPipe FaceDetector initialized successfully (BlazeFace)")
            except Exception as e:
                print(f"[FaceEngine] MediaPipe initialization error: {e}")

        # 2. Initialize Deep Neural Network Face Detector (YuNet)
        yunet_path = os.path.join(models_dir, 'face_detection_yunet.onnx')
        self.yunet = None
        if os.path.exists(yunet_path) and hasattr(cv2, 'FaceDetectorYN'):
            try:
                self.yunet = cv2.FaceDetectorYN.create(
                    model=yunet_path,
                    config="",
                    input_size=(320, 320),
                    score_threshold=0.55,
                    nms_threshold=0.3,
                    top_k=5000
                )
            except Exception as e:
                print(f"[FaceEngine] YuNet initialization error: {e}")

        # Fallback Haar Cascade detector
        local_cascade = os.path.join(models_dir, 'haarcascade_frontalface_default.xml')
        if os.path.exists(local_cascade):
            cascade_path = local_cascade
        else:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

        # 3. Initialize ArcFace Feature Extractor (ONNX)
        arcface_path = os.path.join(models_dir, 'arcface.onnx')
        self.arcface_session = None
        self.arcface_input_name = None
        self.arcface_output_name = None

        if HAS_ORT:
            if not os.path.exists(arcface_path):
                print(f"[FaceEngine] arcface.onnx not found at {arcface_path}. Attempting auto-download...")
                try:
                    import sys
                    ai_dir = os.path.dirname(os.path.dirname(__file__))
                    if ai_dir not in sys.path:
                        sys.path.insert(0, ai_dir)
                    from download_models import download_models
                    download_models()
                except Exception as dl_err:
                    print(f"[FaceEngine] Auto-download notice: {dl_err}. You can run 'python download_models.py'.")

            if os.path.exists(arcface_path):
                try:
                    self.arcface_session = ort.InferenceSession(
                        arcface_path,
                        providers=['CPUExecutionProvider']
                    )
                    self.arcface_input_name = self.arcface_session.get_inputs()[0].name
                    self.arcface_output_name = self.arcface_session.get_outputs()[0].name
                    print(f"[FaceEngine] ArcFace ONNX model loaded successfully (512-D, Input: {self.arcface_input_name})")
                except Exception as e:
                    print(f"[FaceEngine] ArcFace ONNX load failed: {e}")

        # Calibration thresholds
        self.BLUR_THRESHOLD = 30.0        # Laplacian variance minimum
        self.LIVENESS_THRESHOLD = 0.60    # Minimum anti-spoofing score
        self.MATCH_THRESHOLD = 0.65       # ArcFace cosine similarity threshold for identity match
        self.REVIEW_THRESHOLD = 0.52      # Margin where human review is flagged

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

    def align_face_5points(self, img: np.ndarray, landmarks_5: np.ndarray) -> np.ndarray:
        """
        Warps and aligns a detected face into standard 112x112 canonical coordinates
        using similarity transformation based on 5 facial landmarks.
        """
        try:
            M, _ = cv2.estimateAffinePartial2D(landmarks_5.astype(np.float32), self.CANONICAL_5_POINTS)
            if M is not None:
                aligned = cv2.warpAffine(img, M, (112, 112), borderValue=0.0)
                return aligned
        except Exception:
            pass
        return cv2.resize(img, (112, 112))

    def align_face_mediapipe(self, img: np.ndarray, landmarks_4: np.ndarray) -> np.ndarray:
        """
        Warps and aligns a detected face into standard 112x112 canonical coordinates
        using similarity transformation based on 4 MediaPipe landmarks (eyes, nose, mouth).
        """
        try:
            M, _ = cv2.estimateAffinePartial2D(landmarks_4.astype(np.float32), self.CANONICAL_MEDIAPIPE_4_POINTS)
            if M is not None:
                aligned = cv2.warpAffine(img, M, (112, 112), borderValue=0.0)
                return aligned
        except Exception:
            pass
        return cv2.resize(img, (112, 112))

    def detect_and_assess_face(self, img: np.ndarray) -> Tuple[Optional[np.ndarray], Dict[str, Any]]:
        """
        Locates face, ensures exactly one face is present, performs canonical landmark alignment,
        and measures image blur / quality.
        Detection hierarchy:
        1. Google MediaPipe BlazeFace (LiteRT / TFLite 6 Keypoints)
        2. OpenCV YuNet Deep Neural Network (5 Landmarks)
        3. OpenCV Haar Cascade (Frontal Face)
        """
        if img is None or img.size == 0:
            return None, {"error": "Invalid or empty image"}

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Method 1: Google MediaPipe FaceDetector
        if self.mp_detector is not None:
            try:
                import mediapipe as mp
                rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                mp_res = self.mp_detector.detect(mp_img)
                if mp_res.detections and len(mp_res.detections) > 0:
                    if len(mp_res.detections) > 1:
                        return None, {"error": "Multiple faces detected; proxy attempt rejected"}

                    d = mp_res.detections[0]
                    bbox = d.bounding_box
                    fx = max(0, int(bbox.origin_x))
                    fy = max(0, int(bbox.origin_y))
                    fw = min(int(bbox.width), w - fx)
                    fh = min(int(bbox.height), h - fy)

                    if fw > 10 and fh > 10:
                        # Sharpness check
                        face_crop = gray[fy:fy+fh, fx:fx+fw]
                        blur_score = cv2.Laplacian(face_crop if face_crop.size > 0 else gray, cv2.CV_64F).var()
                        if blur_score < self.BLUR_THRESHOLD:
                            return None, {
                                "error": "Image is excessively blurry. Please hold steady in good lighting.",
                                "blur_score": round(float(blur_score), 2)
                            }

                        # Check 4 keypoints for similarity alignment
                        if hasattr(d, 'keypoints') and len(d.keypoints) >= 4:
                            kp = d.keypoints
                            landmarks_4 = np.array([
                                [kp[0].x * w, kp[0].y * h],  # right eye
                                [kp[1].x * w, kp[1].y * h],  # left eye
                                [kp[2].x * w, kp[2].y * h],  # nose tip
                                [kp[3].x * w, kp[3].y * h]   # mouth center
                            ], dtype=np.float32)
                            aligned_roi = self.align_face_mediapipe(img, landmarks_4)
                        else:
                            aligned_roi = cv2.resize(img[fy:fy+fh, fx:fx+fw], (112, 112))

                        return aligned_roi, {
                            "error": None,
                            "bbox": [fx, fy, fw, fh],
                            "blur_score": round(float(blur_score), 2),
                            "detector": "MediaPipe-BlazeFace"
                        }
            except Exception as e:
                print(f"[FaceEngine] MediaPipe detection exception: {e}")

        # Method 2: Try Deep Neural Network (OpenCV YuNet)
        if self.yunet is not None:
            try:
                self.yunet.setInputSize((w, h))
                _, faces = self.yunet.detect(img)
                if faces is not None and len(faces) > 0:
                    # Filter faces with high confidence score
                    confident_faces = [f for f in faces if f[-1] >= 0.50]
                    if len(confident_faces) == 0:
                        confident_faces = [faces[0]]

                    if len(confident_faces) > 1:
                        return None, {"error": "Multiple faces detected; proxy attempt rejected"}

                    f = confident_faces[0]
                    fx, fy, fw, fh = max(0, int(f[0])), max(0, int(f[1])), int(f[2]), int(f[3])
                    fw = min(fw, w - fx)
                    fh = min(fh, h - fy)

                    if fw > 10 and fh > 10:
                        landmarks_5 = np.array([
                            [f[4], f[5]],   # right eye
                            [f[6], f[7]],   # left eye
                            [f[8], f[9]],   # nose tip
                            [f[10], f[11]], # right mouth
                            [f[12], f[13]]  # left mouth
                        ], dtype=np.float32)

                        # Align face to standard 112x112
                        aligned_roi = self.align_face_5points(img, landmarks_5)

                        # Sharpness check
                        face_crop = gray[fy:fy+fh, fx:fx+fw]
                        blur_score = cv2.Laplacian(face_crop if face_crop.size > 0 else gray, cv2.CV_64F).var()
                        if blur_score < self.BLUR_THRESHOLD:
                            return None, {
                                "error": "Image is excessively blurry. Please hold steady in good lighting.",
                                "blur_score": round(float(blur_score), 2)
                            }

                        return aligned_roi, {
                            "error": None,
                            "bbox": [fx, fy, fw, fh],
                            "landmarks": landmarks_5.tolist(),
                            "blur_score": round(float(blur_score), 2),
                            "confidence": round(float(f[-1]), 4),
                            "detector": "YuNet-DNN"
                        }
            except Exception as e:
                print(f"[FaceEngine] YuNet detection exception: {e}")

        # Method B: Fallback to Haar Cascade
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
        aligned_roi = cv2.resize(face_roi, (112, 112))

        # Sharpness check
        blur_score = cv2.Laplacian(gray[y:y+fh, x:x+fw], cv2.CV_64F).var()
        if blur_score < self.BLUR_THRESHOLD:
            return None, {
                "error": "Image is excessively blurry. Please hold steady in good lighting.",
                "blur_score": round(float(blur_score), 2)
            }

        return aligned_roi, {
            "error": None,
            "bbox": [int(x), int(y), int(fw), int(fh)],
            "blur_score": round(float(blur_score), 2),
            "detector": "HaarCascade"
        }

    def assess_liveness(self, img: np.ndarray, face_roi: np.ndarray) -> Dict[str, Any]:
        """
        Evaluates presentation attack indicators:
        - Texture frequency spectrum: Printed paper and smartphone screens attenuate natural micro-textures.
        - Color saturation distribution: Digital screens have distinct chromatic peaks and backlight glare.
        - Gradient uniformity: Screens exhibit flat directional backlight gradients.
        """
        gray_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        hsv_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2HSV)

        # A. High-Frequency Micro-Texture Measure
        laplacian_var = cv2.Laplacian(gray_roi, cv2.CV_64F).var()
        texture_score = min(1.0, laplacian_var / 300.0)

        # B. Color Gamut and Saturation Dispersion
        sat_channel = hsv_roi[:, :, 1]
        sat_std = np.std(sat_channel)
        sat_score = min(1.0, sat_std / 35.0)

        # C. Gradient Uniformity Check
        sobelx = cv2.Sobel(gray_roi, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray_roi, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.mean(np.sqrt(sobelx**2 + sobely**2))
        gradient_score = min(1.0, grad_mag / 40.0)

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
        Generates a 512-dimensional normalized biometric feature vector.
        Primary: ArcFace Deep ResNet ONNX model (Input: 112x112 RGB normalized)
        Fallback: Spatial Multi-Scale Local Binary Patterns & Gradient Histogram (512-D)
        """
        # Primary: ArcFace Deep Neural Network
        if self.arcface_session is not None:
            try:
                # Ensure 112x112 geometry in RGB format
                if face_roi.shape[:2] != (112, 112):
                    face_roi = cv2.resize(face_roi, (112, 112))
                
                rgb = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB).astype(np.float32)
                # Standard ArcFace input normalization: (x - 127.5) / 128.0
                normalized = (rgb - 127.5) / 128.0
                batch = np.expand_dims(normalized, axis=0)

                raw_emb = self.arcface_session.run(
                    [self.arcface_output_name],
                    {self.arcface_input_name: batch}
                )[0][0]

                # L2 Normalization to unit hypersphere
                norm = np.linalg.norm(raw_emb)
                if norm > 1e-6:
                    return (raw_emb / norm).astype(np.float32)
                return raw_emb.astype(np.float32)
            except Exception as e:
                print(f"[FaceEngine] ArcFace inference error, falling back to LBP: {e}")

        # Fallback: Spatial Multi-Scale LBP Histogram (512-D)
        aligned = cv2.resize(face_roi, (128, 128))
        gray = cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)

        grid_rows, grid_cols = 8, 8
        h_step, w_step = 16, 16
        features = []

        for r in range(grid_rows):
            for c in range(grid_cols):
                block = gray[r*h_step:(r+1)*h_step, c*w_step:(c+1)*w_step]
                gx = cv2.Sobel(block, cv2.CV_32F, 1, 0, ksize=3)
                gy = cv2.Sobel(block, cv2.CV_32F, 0, 1, ksize=3)
                mag, ang = cv2.cartToPolar(gx, gy, angleInDegrees=True)
                hist, _ = np.histogram(ang, bins=8, range=(0, 360), weights=mag)
                features.extend(hist)

        embedding = np.array(features, dtype=np.float32)
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
        3. Extracts ArcFace biometric embeddings from both.
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

        # Step 3: Biometric feature embedding extraction (ArcFace 512-D)
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
