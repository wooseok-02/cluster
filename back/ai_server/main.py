import io
import numpy as np
from fastapi import FastAPI, UploadFile, HTTPException
from PIL import Image
from deepface import DeepFace

app = FastAPI()


def bytes_to_numpy(data: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(data)).convert("RGB")
    return np.array(image)


@app.post("/embed")
async def embed(file: UploadFile):
    data = await file.read()
    img_array = bytes_to_numpy(data)

    try:
        results = DeepFace.represent(
            img_path=img_array,
            model_name="Facenet",
            enforce_detection=False,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"얼굴 감지 실패: {str(e)}")

    if not results:
        raise HTTPException(status_code=422, detail="얼굴을 감지할 수 없습니다.")

    embedding = results[0]["embedding"]
    return {"embedding": embedding}


@app.post("/detect")
async def detect(file: UploadFile):
    data = await file.read()
    img_array = bytes_to_numpy(data)

    try:
        results = DeepFace.represent(
            img_path=img_array,
            model_name="Facenet",
            enforce_detection=False,
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"얼굴 감지 실패: {str(e)}")

    if not results:
        raise HTTPException(status_code=422, detail="얼굴을 감지할 수 없습니다.")

    faces = [{"embedding": r["embedding"]} for r in results]
    return {"faces": faces, "face_count": len(faces)}
