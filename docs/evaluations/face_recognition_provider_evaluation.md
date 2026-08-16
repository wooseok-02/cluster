# Face Recognition Provider Evaluation

## Purpose

기존 DeepFace 기반 구현과 v2 얼굴 인식 provider 구조를 비교한다.

## Comparison Target

### Legacy Provider

- DeepFace 직접 사용
- 모델/전처리/매칭 로직 결합
- 성능과 실패 정책이 서비스 코드에 섞일 가능성 존재

### V2 Provider

- 교체 가능한 FaceRecognitionProvider 구조
- pretrained embedding model 기반 verification
- similarity + threshold 기반 match/unknown 판단
- mock provider를 통한 테스트 가능성

## Candidate Metrics

- Match accuracy
- Unknown 판정 정확도
- Latency
- 모델 로딩 비용
- 실패율
- 테스트 용이성
- provider 교체 비용

## Status

- Planned
- 세부 설계는 얼굴 인식 기능을 직접 다루는 단계에서 확정한다.
