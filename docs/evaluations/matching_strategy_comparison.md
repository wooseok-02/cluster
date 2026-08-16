# Legacy vs AI-assisted Matching

## Purpose

기존 hardcoded matching 로직과 v2 matching/orchestration 구조를 같은 benchmark dataset으로 비교한다.

## Comparison Target

### Legacy Matcher

- 날짜 일치
- GPS 거리 threshold
- 시간 threshold
- 단순 일정/장소 후보 반환

### V2 Matcher

- 후보 생성
- context-aware ranking
- confidence 제공
- reason 제공
- fallback 정책

## Candidate Metrics

- Top-1 accuracy
- Top-3 accuracy
- False positive rate
- False negative rate
- No-match 처리 정확도
- Latency
- API/token cost
- 설명 가능성
- 테스트 가능성

## Status

- Planned
- 세부 설계는 사진 분석/AI 매칭 오케스트레이션 설계 단계에서 확정한다.
