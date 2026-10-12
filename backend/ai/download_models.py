"""
AEC MCA Attendance System - AI Model Auto-Downloader
Downloads required open-source deep learning models:
1. Google MediaPipe BlazeFace Short-Range LiteRT (models/blaze_face_short_range.tflite)
2. OpenCV YuNet Deep Neural Network Face Detector (models/face_detection_yunet.onnx)
3. ArcFace ResNet Deep Embedding ONNX 512-D (models/arcface.onnx)
"""

import os
import urllib.request
import sys

MODELS = {
    "blaze_face_short_range.tflite": "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
    "face_detection_yunet.onnx": "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    "arcface.onnx": "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/arcface/model/arcfaceresnet100-8.onnx"
}

def download_models():
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)

    print("=== Downloading AEC MCA Biometric Vision Models ===")
    for filename, url in MODELS.items():
        filepath = os.path.join(models_dir, filename)
        if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
            print(f"[OK] {filename} already exists ({os.path.getsize(filepath) / (1024*1024):.2f} MB)")
            continue

        print(f"[DOWNLOADING] {filename} from {url} ...")
        try:
            opener = urllib.request.build_opener()
            opener.addheaders = [('User-Agent', 'Mozilla/5.0')]
            urllib.request.install_opener(opener)
            urllib.request.urlretrieve(url, filepath)
            print(f"[SUCCESS] Downloaded {filename} ({os.path.getsize(filepath) / (1024*1024):.2f} MB)")
        except Exception as e:
            print(f"[FAILED] Could not download {filename}: {e}", file=sys.stderr)

if __name__ == "__main__":
    download_models()
