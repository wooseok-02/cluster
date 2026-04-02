from PIL import Image
import numpy as np
import io
from deepface import DeepFace

def extract_embedding(photo_bytes: bytes) -> bytes:
    # 2단계: bytes → PIL Image → numpy array
    image = Image.open(io.BytesIO(photo_bytes))
    img_array = np.array(image)
    
    # 6단계: DeepFace로 임베딩 추출 벡터화 완료
    result = DeepFace.represent(
        img_path=img_array, #얼굴 감지 
        model_name="Facenet", #128배열
        enforce_detection=False #감지 실패시 에러
    )
    
    # 7단계: list[float] → bytes
    embedding = result[0]["embedding"]
    return np.array(embedding).tobytes()