# Cluster Development Rules

이 프로젝트는 백엔드 설계 능력, AI 파이프라인 통합 능력, 기획 능력을 보여주기 위한 포트폴리오 프로젝트다.

## Project Positioning

- Cluster는 사진, 위치, 일정, 얼굴 인식 데이터를 조합해 만남 기록을 구조화하는 AI-assisted backend application이다.
- 실제 사용자 유치나 상용 운영보다, 로컬 데모 가능한 백엔드 설계 완성도를 우선한다.
- 프론트엔드는 핵심 평가 대상이 아니며, 백엔드 기능과 데모 흐름을 보조하는 수준으로 유지한다.

## Documentation First

- 기능 변경 전 관련 문서를 먼저 확인한다.
- 요구사항이 바뀌면 `docs/01_requirements.md`를 갱신한다.
- 기능 범위가 바뀌면 `docs/02_functional_spec.md`를 갱신한다.
- 사용자 흐름이 바뀌면 `docs/03_user_flows.md`를 갱신한다.
- 화면 구조가 바뀌면 `docs/04_wireframes.md`를 갱신한다.
- DB 모델이나 저장 데이터가 바뀌면 `docs/05_data_schema.md`를 갱신한다.
- API 계약이 바뀌면 `docs/06_api_spec.md`를 갱신한다.
- 내부 처리 흐름이 바뀌면 `docs/07_system_flows.md`를 갱신한다.
- 예외/실패 정책이 바뀌면 `docs/08_exceptions.md`를 갱신한다.
- 함수/모듈 설계가 바뀌면 `docs/09_function_design.md`를 갱신한다.
- 주요 설계 판단은 `docs/10_architecture_decisions.md`에 남긴다.
- 테스트나 데모 방식이 바뀌면 `docs/11_test_demo_plan.md`를 갱신한다.
- 성능 비교, 개선 전/후 평가, trade-off가 생기면 `docs/12_evaluation_tradeoffs.md`와 관련 세부 문서를 갱신한다.
- 버전별 설계 기록과 장기 로드맵은 `docs/versions/`에 남긴다. `docs/` 루트 문서는 항상 최신 설계를 기준으로 유지한다.

## Engineering Principles

- API layer, application/use-case layer, domain logic, repository, external client 책임을 구분한다.
- 핵심 백엔드 로직은 테스트 가능한 구조로 작성한다.
- AI 서버, Cloudinary, Kakao API 같은 외부 의존성은 직접 섞지 말고 client 경계로 다룬다.
- 사진 분석과 기록 확정은 분리한다. 분석 단계는 후보를 반환하고, 확정 단계에서만 DB 변경을 수행한다.
- ActivityLog 생성, 방문 횟수, 상태 갱신은 데이터 일관성을 기준으로 설계한다.
- 큰 리팩터링은 문서 기준을 먼저 합의한 뒤 진행한다.

## Scope Control

- 포트폴리오 핵심과 무관한 기능 확장은 피한다.
- UI polish보다 백엔드 구조, 데이터 모델, API 계약, 테스트, 데모 재현성을 우선한다.
- 기존 코드는 참고 자료로 보되, 포트폴리오 목표와 맞지 않으면 재설계할 수 있다.
