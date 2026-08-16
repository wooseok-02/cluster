# External Data Import Trade-offs

## Purpose

사용자 입력 부담을 줄이기 위한 외부 데이터 import 전략을 비교한다.

## Comparison Target

### Manual Input

- 구현이 단순하다.
- 개인정보 리스크가 낮다.
- 초기 입력 부담이 크다.

### Mock/Seed Import Adapter

- 포트폴리오 데모에 적합하다.
- adapter 구조를 보여줄 수 있다.
- 실제 서비스 연동 리스크를 피할 수 있다.

### Real Contacts/Calendar Integration

- 실제 사용성 개선 효과가 크다.
- 권한, 개인정보, 플랫폼 정책, 운영 비용이 커진다.
- 서비스화 단계에서 별도 검토가 필요하다.

## Candidate Metrics

- 초기 입력 시간 감소
- 구현 범위
- 개인정보 리스크
- 로컬 데모 안정성
- 실제 서비스 확장성
- 유지보수 비용

## Status

- Planned
- 포트폴리오 v2에서는 adapter 구조와 demo import 흐름을 우선한다.
