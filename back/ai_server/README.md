# AI Server

HuggingFace Spaces 배포용 AI 서버입니다.

DeepFace + Facenet 모델을 사용해 이미지에서 얼굴 임베딩을 추출합니다.

## 엔드포인트

### POST /embed
이미지 1장을 받아 단일 얼굴 임베딩을 반환합니다.

- **요청**: `multipart/form-data` — `file` (이미지)
- **응답**: `{"embedding": [float, ...]}`

### POST /detect
이미지 1장을 받아 이미지 내 모든 얼굴의 임베딩을 반환합니다.

- **요청**: `multipart/form-data` — `file` (이미지)
- **응답**: `{"faces": [{"embedding": [float, ...]}, ...], "face_count": int}`

## 로컬 실행

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 7860
```

## 배포

HuggingFace Spaces (SDK: Docker 또는 Gradio) 환경에 배포합니다.
`requirements.txt`의 의존성을 그대로 사용합니다.
