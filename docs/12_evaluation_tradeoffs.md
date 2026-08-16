# 12. Evaluation and Trade-offs

## Purpose

Cluster v2에서 기존 구현과 개선 설계를 비교하고, 어떤 설계를 왜 선택했는지 지표와 근거로 남긴다.

이 문서는 세부 실험 문서로 이동하는 index 역할을 한다. 각 비교 항목의 상세 기준, 데이터셋, 결과, 결론은 별도 문서에서 관리한다.

## Evaluation Routes

| Topic | Document | Status | Purpose |
| --- | --- | --- | --- |
| Matching strategy comparison | [Legacy vs AI-assisted matching](./evaluations/matching_strategy_comparison.md) | Planned | 기존 hardcoded matching과 v2 matching/orchestration을 비교한다. |
| Face recognition provider comparison | [Face recognition provider evaluation](./evaluations/face_recognition_provider_evaluation.md) | Planned | DeepFace legacy provider와 v2 embedding verification provider를 비교한다. |
| External data import trade-off | [External data import trade-offs](./evaluations/external_data_import_tradeoffs.md) | Planned | 수동 입력, mock import, 실제 contacts/calendar 연동의 범위와 비용을 비교한다. |
| Demo readiness metrics | [Local demo readiness metrics](./evaluations/local_demo_readiness_metrics.md) | Planned | 면접용 로컬 데모가 얼마나 재현 가능하고 안정적인지 점검한다. |

## Evaluation Principles

- 개선 전/후를 같은 입력 데이터로 비교한다.
- 정확도만 보지 않고 latency, cost, 구현 복잡도, 테스트 가능성, 설명 가능성을 함께 본다.
- AI를 도입했을 때 항상 좋아졌다고 가정하지 않는다.
- 기존 rule-based 방식이 더 나은 조건도 명확히 기록한다.
- 최종 선택은 성능 수치뿐 아니라 포트폴리오 목표, 유지보수성, 데모 안정성을 함께 고려한다.

## Candidate Metrics

- Top-1 accuracy
- Top-3 accuracy
- False positive rate
- False negative rate
- Unknown/no-match handling accuracy
- Latency
- API/token cost
- Fallback success rate
- Explanation quality
- Testability
- Code complexity

## Status

- Draft
- 세부 실험 설계는 각 기능을 직접 설계하는 단계에서 확정한다.
