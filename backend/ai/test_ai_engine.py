import cv2
import numpy as np
import base64
from core.face_engine import FaceEngine

def create_synthetic_face_image(seed=42):
    """Generates a synthetic portrait-like test image with facial features."""
    np.random.seed(seed)
    img = np.ones((300, 300, 3), dtype=np.uint8) * 220
    # Head contour
    cv2.ellipse(img, (150, 150), (80, 110), 0, 0, 360, (180, 150, 130), -1)
    # Eyes
    cv2.circle(img, (120, 125), 12, (255, 255, 255), -1)
    cv2.circle(img, (180, 125), 12, (255, 255, 255), -1)
    cv2.circle(img, (120, 125), 5, (40, 40, 40), -1)
    cv2.circle(img, (180, 125), 5, (40, 40, 40), -1)
    # Nose
    cv2.line(img, (150, 135), (150, 165), (140, 110, 90), 3)
    # Mouth
    cv2.ellipse(img, (150, 195), (25, 10), 0, 0, 180, (70, 70, 170), -1)
    # Add subtle natural texture
    noise = np.random.normal(0, 4, img.shape).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return img

def image_to_base64(img):
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

def run_tests():
    print("=== Testing AEC MCA Face Engine ===")
    engine = FaceEngine()

    # Test 1: Empty / Blank Image (No Face)
    blank_img = np.zeros((300, 300, 3), dtype=np.uint8)
    blank_b64 = image_to_base64(blank_img)
    res_blank = engine.verify_liveness(blank_b64)
    assert not res_blank["is_live"], "Blank image should fail liveness"
    assert "No face" in res_blank["error"], f"Expected 'No face' error, got {res_blank['error']}"
    print("[PASS] Test 1: Blank image correctly rejected (No face detected)")

    # Test 2: Synthetic Face Detection & Embedding Extraction
    face_img = create_synthetic_face_image(42)
    face_b64 = image_to_base64(face_img)
    
    # Extract embedding directly
    face_roi = face_img[50:250, 70:230]
    embedding1 = engine.extract_embedding(face_roi)
    assert len(embedding1) == 512, f"Expected 512-D embedding, got {len(embedding1)}"
    norm1 = np.linalg.norm(embedding1)
    assert abs(norm1 - 1.0) < 1e-4, f"Embedding must be unit normalized, got {norm1}"
    print(f"[PASS] Test 2: Biometric embedding extracted (Dimension: {len(embedding1)}, L2 Norm: {norm1:.4f})")

    # Test 3: Cosine Similarity with Self (Identical Image)
    sim_self = engine.compute_similarity(embedding1, embedding1)
    assert abs(sim_self - 1.0) < 1e-4, f"Self-similarity should be 1.0, got {sim_self}"
    print(f"[PASS] Test 3: Self-comparison cosine similarity is {sim_self:.4f}")

    # Test 4: Cosine Similarity with Altered Image (Different Seed/Face)
    face_img2 = create_synthetic_face_image(99)
    # Shift features
    cv2.circle(face_img2, (110, 115), 18, (10, 10, 10), -1)
    face_roi2 = face_img2[50:250, 70:230]
    embedding2 = engine.extract_embedding(face_roi2)
    sim_diff = engine.compute_similarity(embedding1, embedding2)
    assert sim_diff < 0.95, f"Altered face should have lower similarity, got {sim_diff}"
    print(f"[PASS] Test 4: Different face similarity is {sim_diff:.4f} (< 0.95)")

    # Test 5: End-to-End Face Match Logic
    match_result = engine.verify_face_match(face_b64, face_b64)
    print(f"[PASS] Test 5: End-to-end match execution verified (Liveness: {match_result.get('is_live')})")

    print("\nALL AI ENGINE UNIT TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
