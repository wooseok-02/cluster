# 02. Functional Spec

## Purpose

요구사항을 사용자 기능 단위로 나누고, 각 기능의 입력, 처리, 결과를 정리한다. 각 기능은 `docs/01_requirements.md`의 요구사항 ID와 연결해 추적 가능하게 관리한다.

## Scope Labels

- `Required`: 포트폴리오 v2에서 구현 또는 정리해야 하는 핵심 범위
- `Design First`: v2에서는 구조와 문서화를 우선하고, 실제 운영 연동은 이후 확장
- `Support`: 핵심 데모를 보조하는 범위

## Feature Areas

### F-01. 인증/사용자 프로필

- Scope: Required
- Requirement IDs: `UR-07`, `BR-01`, `NFR-01`, `NFR-02`

사용자가 자신의 데이터 공간을 갖고, 사람/장소/일정/기록 데이터를 사용자 단위로 분리하기 위한 기능이다.

주요 기능:

- 회원가입
- 로그인
- 현재 사용자 조회
- 사용자 프로필 관리
- 사용자별 데이터 소유권 검증

### F-02. 관계 대상 관리

- Scope: Required
- Requirement IDs: `UR-01`, `UR-06`, `BR-01`, `BR-04`, `AIR-04`

사용자가 기록하고 싶은 관계 대상을 등록하고, 이후 일정/사진/활동 로그와 연결하기 위한 기능이다.

주요 기능:

- 사람 등록
- 사람 목록 조회
- 사람 상세 조회
- 사람 프로필 사진/얼굴 임베딩 관리
- 사람별 만남 기록 조회
- 사람별 count/status 관리

### F-03. 장소 관리

- Scope: Required
- Requirement IDs: `UR-02`, `UR-06`, `BR-01`, `BR-04`, `BR-05`

사진 위치 정보와 일정 장소를 매칭하기 위한 기준 장소 데이터를 관리하는 기능이다.

주요 기능:

- 장소 검색
- 장소 등록
- 장소 목록 조회
- 장소 상세 조회
- 장소별 방문 기록 조회
- 장소별 visit_count/status 관리

### F-04. 일정 관리

- Scope: Required
- Requirement IDs: `UR-03`, `UR-06`, `BR-01`, `BR-04`

사진 업로드 분석 시 비교 기준이 되는 예정된 만남 데이터를 관리하는 기능이다.

주요 기능:

- 일정 생성
- 일정 목록/캘린더 조회
- 일정 상세 조회
- 일정 수정
- 일정 상태 관리
- 일정과 사람/장소 연결

### F-05. 사진 업로드 분석

- Scope: Required
- Requirement IDs: `UR-04`, `UR-05`, `BR-02`, `BR-03`, `AIR-01`, `AIR-02`, `AIR-03`, `AIR-04`, `NFR-03`

사용자가 업로드한 사진을 분석해 만남 기록 후보를 생성하는 기능이다. 이 단계에서는 ActivityLog를 확정 저장하지 않는다.

주요 기능:

- 이미지 파일 검증
- EXIF 날짜/위치 추출
- EXIF 유무에 따른 사진 분리
- 날짜/위치 기반 사진 그룹화
- 등록 장소 후보 탐색
- 기존 일정 후보 매칭
- 얼굴 인식 provider 호출
- 분석 결과 반환

### F-06. AI 매칭 오케스트레이션

- Scope: Required
- Requirement IDs: `UR-04`, `UR-09`, `BR-03`, `BR-06`, `BR-05`, `AIR-01`, `AIR-02`, `AIR-03`, `NFR-03`

rule 기반 후보 생성 결과와 AI 판단을 조합해 일정/장소/인물 후보를 ranking하고, confidence와 reason을 반환하는 기능이다.

주요 기능:

- 후보 context 구성
- deterministic candidate 생성
- AI/rule scorer 호출
- 후보 ranking
- confidence 산정
- 추천 이유 생성
- 실패 시 fallback 결과 반환

### F-07. 활동 로그 확정

- Scope: Required
- Requirement IDs: `UR-05`, `UR-06`, `BR-02`, `BR-04`, `NFR-03`

사용자가 분석 결과를 확인한 뒤 실제 만남 기록으로 저장하는 기능이다.

주요 기능:

- 분석 결과 기반 ActivityLog 생성
- 사진 저장 및 ActivityLog 연결
- Schedule 완료 처리
- Person count/status 갱신
- Place visit_count/status 갱신
- 중복 ActivityLog 방지
- 트랜잭션 단위 보장

### F-08. 기록 조회/인사이트

- Scope: Required
- Requirement IDs: `UR-06`, `BR-01`, `BR-04`

확정된 만남 기록을 사람, 장소, 캘린더 관점에서 다시 확인하는 기능이다.

주요 기능:

- 사람별 활동 기록 조회
- 장소별 방문 기록 조회
- 캘린더 기반 일정/완료 기록 조회
- 관계 상태 표시
- 방문 상태 표시

### F-09. 외부 데이터 연동

- Scope: Design First
- Requirement IDs: `UR-08`, `BR-05`, `BR-07`, `NFR-01`

사용자의 초기 입력 부담을 줄이기 위해 연락처와 캘린더 데이터를 선택적으로 가져오는 기능이다. 포트폴리오 v2에서는 실제 운영 연동보다 adapter 구조와 mock/seed 기반 데모 흐름을 우선한다.

주요 기능:

- 연락처 import adapter
- 캘린더 import adapter
- import candidate 생성
- 사용자의 선택/수정/확정
- 확정된 candidate를 Person 또는 Schedule로 변환

### F-10. 데모/테스트 지원

- Scope: Support
- Requirement IDs: `NFR-01`, `NFR-02`, `NFR-03`, `NFR-04`, `AIR-03`

면접에서 로컬로 핵심 플로우를 재현하고, 백엔드 설계 품질을 보여주기 위한 보조 기능이다.

주요 기능:

- seed data
- demo scenario
- Swagger/API 문서 정리
- 핵심 도메인 테스트
- mock AI provider
- 외부 API mock adapter
- 로컬 실행 스크립트

## Requirement Traceability Summary

| Feature ID | Feature | Requirement IDs | Scope |
| --- | --- | --- | --- |
| F-01 | 인증/사용자 프로필 | `UR-07`, `BR-01`, `NFR-01`, `NFR-02` | Required |
| F-02 | 관계 대상 관리 | `UR-01`, `UR-06`, `BR-01`, `BR-04`, `AIR-04` | Required |
| F-03 | 장소 관리 | `UR-02`, `UR-06`, `BR-01`, `BR-04`, `BR-05` | Required |
| F-04 | 일정 관리 | `UR-03`, `UR-06`, `BR-01`, `BR-04` | Required |
| F-05 | 사진 업로드 분석 | `UR-04`, `UR-05`, `BR-02`, `BR-03`, `AIR-01`, `AIR-02`, `AIR-03`, `AIR-04`, `NFR-03` | Required |
| F-06 | AI 매칭 오케스트레이션 | `UR-04`, `UR-09`, `BR-03`, `BR-06`, `BR-05`, `AIR-01`, `AIR-02`, `AIR-03`, `NFR-03` | Required |
| F-07 | 활동 로그 확정 | `UR-05`, `UR-06`, `BR-02`, `BR-04`, `NFR-03` | Required |
| F-08 | 기록 조회/인사이트 | `UR-06`, `BR-01`, `BR-04` | Required |
| F-09 | 외부 데이터 연동 | `UR-08`, `BR-05`, `BR-07`, `NFR-01` | Design First |
| F-10 | 데모/테스트 지원 | `NFR-01`, `NFR-02`, `NFR-03`, `NFR-04`, `AIR-03` | Support |
