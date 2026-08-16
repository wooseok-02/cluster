# Cluster v2: Backend Re-architecture

## Purpose

v1에서 발견한 문제를 바탕으로, 포트폴리오용 백엔드 설계와 AI application architecture를 재구성한다.

v2의 목표는 기능을 무작정 늘리는 것이 아니라, 같은 제품 문제를 더 성숙한 백엔드 구조, 평가 가능한 AI 파이프라인, 테스트 가능한 도메인 로직으로 다시 해결하는 것이다.

## Positioning

- v1: 기능 구현 중심 MVP, 아이디어 검증
- v2: 백엔드 설계, AI orchestration, 데이터 일관성, 평가/테스트 중심 re-architecture
- v3: 실제 서비스화, 외부 연동, privacy-first AI 확장

## v2 Rebuild Themes

### 1. Matching Quality 개선

v1 문제:

- 장소 판정이 하드코딩된 공간/시간 threshold에 의존한다.
- 일정 판정이 장소 판정 결과에 과하게 의존한다.
- 사람 인식 성능을 측정할 수 없다.

v2 방향:

- 기존 rule-based matcher를 legacy baseline으로 남긴다.
- v2 matcher는 후보 생성, ranking, confidence, reason을 분리해서 설계한다.
- 같은 benchmark dataset으로 legacy matcher와 v2 matcher를 비교한다.
- 정확도뿐 아니라 false positive, false negative, no-match 처리, latency, cost를 함께 평가한다.

관련 문서:

- [Evaluation and Trade-offs](../12_evaluation_tradeoffs.md)
- [Legacy vs AI-assisted Matching](../evaluations/matching_strategy_comparison.md)
- [Face Recognition Provider Evaluation](../evaluations/face_recognition_provider_evaluation.md)

### 2. Architecture 재정리

v1 문제:

- 사진 업로드와 수동 일정 확정의 내부 분기가 복잡하다.
- 분석 단계와 확정 단계의 책임 경계가 불분명하다.
- 데이터 일관성 기준과 트랜잭션 경계가 약하다.
- 외부 의존성이 service 로직에 섞여 있다.

v2 방향:

- API layer, application/use-case layer, domain service, repository, external client 책임을 분리한다.
- 사진 분석은 후보 결과를 반환하는 read/analysis flow로 둔다.
- ActivityLog 확정은 DB 변경이 발생하는 command flow로 분리한다.
- AI 서버, storage, place search, import source는 client/adapter 경계로 분리한다.
- ActivityLog 생성, Schedule 완료, Person/Place count 갱신을 하나의 트랜잭션 기준으로 설계한다.

관련 문서:

- [System Flows](../07_system_flows.md)
- [Function Design](../09_function_design.md)
- [Architecture Decisions](../10_architecture_decisions.md)

### 3. Reliability and Observability 강화

v1 문제:

- 얼굴 임베딩 API latency가 크고 통제하기 어렵다.
- 사진 분석 파이프라인의 단계별 로그와 지표가 부족하다.
- 비용/latency/정확도의 trade-off 판단 기준이 없다.

v2 방향:

- AI provider 호출을 측정 가능한 경계로 분리한다.
- 사진 분석 파이프라인 단계별 latency와 실패 지점을 기록할 수 있게 한다.
- fallback 발생률, 외부 API 실패율, AI 호출 비용을 평가 항목으로 둔다.
- 로컬 데모에서는 mock provider를 통해 외부 의존성 없이 핵심 플로우를 재현할 수 있게 한다.

관련 문서:

- [Test and Demo Plan](../11_test_demo_plan.md)
- [Local Demo Readiness Metrics](../evaluations/local_demo_readiness_metrics.md)

### 4. Security and Product UX 개선

v1 문제:

- 사진, 얼굴 임베딩, 위치, 관계 데이터 보호 정책이 약하다.
- 사용자 입력 부담이 크다.

v2 방향:

- 사진과 얼굴 임베딩을 민감 데이터로 분류하고 저장/전송/로그 정책을 문서화한다.
- 실제 서비스 수준의 모든 보안 기능을 구현하기보다, v2에서는 위험을 식별하고 최소 보호 기준을 설계한다.
- 사람/일정 입력 부담을 줄이기 위해 외부 데이터 import adapter 구조를 설계한다.
- 실제 연락처/캘린더/카카오 운영 연동은 v3 범위로 두고, v2에서는 mock/seed 기반 import flow를 우선한다.

관련 문서:

- [Exceptions](../08_exceptions.md)
- [External Data Import Trade-offs](../evaluations/external_data_import_tradeoffs.md)
- [v3 Service Expansion Roadmap](./v3_service_expansion.md)

### 5. Documentation and Testing 강화

v1 문제:

- 요구사항, 기능 명세, API, 데이터 스키마, 시스템 흐름이 정리되어 있지 않다.
- 테스트 전략이 부족하다.

v2 방향:

- `docs/` 루트 문서를 최신 설계 기준으로 유지한다.
- 기능별 요구사항 ID와 기능 ID를 연결해 traceability를 확보한다.
- 핵심 도메인 로직은 단위 테스트로 검증 가능하게 분리한다.
- 외부 API와 AI 서버는 mock 가능하게 설계한다.
- legacy vs v2 비교 실험을 평가 문서로 남긴다.

관련 문서:

- [Requirements](../01_requirements.md)
- [Functional Spec](../02_functional_spec.md)
- [API Spec](../06_api_spec.md)
- [Evaluation and Trade-offs](../12_evaluation_tradeoffs.md)

## v2 Working Scope

v2에서 집중할 범위:

- 백엔드 계층 구조 재정리
- 사진 분석과 활동 로그 확정 분리
- AI 매칭 오케스트레이션 설계
- 얼굴 인식 provider 구조 재설계
- 외부 의존성 client/adapter 분리
- 평가/트레이드오프 문서화
- 테스트와 로컬 데모 강화

v2에서 의도적으로 미루는 범위:

- 실제 연락처/캘린더/카카오 운영 연동
- 온디바이스 AI
- 멀티모달 인물 매칭 고도화
- 실제 서비스 출시/운영 기능
- 대규모 트래픽 대응 인프라

## v2 Success Criteria

- v1의 주요 한계가 문서로 정리되어 있다.
- v2 설계 문서가 요구사항, 기능, 데이터, API, 시스템 흐름을 연결한다.
- 사진 분석과 활동 로그 확정의 책임 경계가 명확하다.
- legacy matcher와 v2 matcher를 같은 데이터셋으로 비교할 수 있다.
- AI provider와 외부 API가 mock 가능한 구조다.
- 핵심 도메인 로직이 테스트 가능하다.
- 면접에서 로컬 데모와 아키텍처 설명이 가능하다.

## Status

- Draft
- v2 변경 범위와 우선순위는 계속 논의하며 갱신한다.
