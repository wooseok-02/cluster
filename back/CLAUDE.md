# CLUSTER 프로젝트

> 사진 기반 인생 인프라 구축 서비스 — 사진 속 인물/장소를 자동 분석하여 인간관계와 장소 기록을 체계적으로 관리

## 기술 스택

- **Framework**: FastAPI (0.128.8)
- **ORM**: SQLAlchemy (2.0.46)
- **DB**: SQLite (개발), `check_same_thread=False` 설정
- **인증**: JWT (python-jose), OAuth2PasswordBearer
- **Validation**: Pydantic v2 (2.12.5), pydantic-settings
- **환경변수**: python-dotenv, `.env` 파일로 관리
- **Python**: 3.12.9

## 프로젝트 구조

```
back/app/
├── main.py                 # FastAPI 앱 생성, 라우터 등록
├── config/
│   ├── config.py           # Settings (환경변수: SECRET_KEY, ALGORITHM, DATABASE_URL 등)
│   ├── database.py         # engine, SessionLocal, Base, get_db
│   └── security.py         # create_access_token, decoder_token, oauth2_scheme
├── auth/
│   ├── model.py            # User 모델
│   ├── schema.py           # UserCreate, UserRead, UserLogin, UserLoginResponse
│   ├── service.py          # register_user, login_user
│   ├── api.py              # /auth/register, /auth/login
│   └── token.py            # get_current_user (의존성 주입)
├── people/
│   ├── model.py            # People 모델
│   ├── schema.py           # PersonCreate, PersonData, PersonRead
│   ├── service.py          # create_people, get_people
│   └── api.py              # /people/register/people, /people/load/people
├── place/
│   ├── model.py            # Place 모델 (이미 정의됨)
│   ├── schema.py           # (미구현)
│   ├── service.py          # (미구현)
│   └── api.py              # (미구현)
├── schedule/
│   ├── model.py            # (미구현)
│   ├── schema.py           # (미구현)
│   ├── service.py          # (미구현)
│   └── api.py              # (미구현)
└── activity/
    ├── model.py            # (미구현)
    ├── schema.py           # (미구현)
    ├── service.py          # (미구현)
    └── api.py              # (미구현)
```

## DB 모델 (ERD)

### USER
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | Integer | PK |
| email | String | unique |
| password | String | 현재 평문 저장 (해싱 미적용) |
| nick_name | String | |
| age | Integer | |
| gender | String | |

### PEOPLE
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | Integer | PK |
| name | String | |
| age | Integer | |
| relation | String | |
| address | String | |
| count | Integer | default=0 |
| status | String | default="new" (new/regular/best/alert) |
| embedding | LargeBinary | 얼굴 임베딩 (Optional) |
| user_id | Integer | FK → USER.id |

### PLACE
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | Integer | PK |
| name | String | |
| longitude | Float | |
| latitude | Float | |
| visit_count | Integer | default=0 |
| status | String | default="new" |
| user_id | Integer | FK → USER.id |

### SCHEDULE (미구현)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | Integer | PK |
| user_id | Integer | FK → USER.id |
| place_id | Integer | FK → PLACE.id |
| title | String | |
| start_time | Timestamp | |
| end_time | Timestamp | |
| memo | String | |
| status | String | "Planned" / "Completed" |

### ACTIVITY_LOG (미구현)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| log_id | Integer | PK |
| user_id | Integer | FK → USER.id |
| place_id | Integer | FK → PLACE.id |
| date | Date | |
| time | Time | |
| memo | String | |

### LOG_PEOPLE (미구현 — 다대다 연결 테이블)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| log_id | Integer | FK → ACTIVITY_LOG.log_id |
| people_id | Integer | FK → PEOPLE.id |

### PHOTO (미구현)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | Integer | PK |
| log_id | Integer | FK → ACTIVITY_LOG.log_id |
| photo_url | String | |

## 코딩 컨벤션 (반드시 준수)

### API 응답 형식
모든 API 응답은 아래 구조를 따른다:
```json
{
  "status": 200,
  "message": "설명 메시지",
  "data": { ... }
}
```

### Pydantic 스키마 규칙
- **요청용**: `XxxCreate` (예: `PersonCreate`, `PlaceCreate`)
- **응답 data용**: `XxxData` (예: `PersonData`, `PlaceData`)
- **응답 전체용**: `XxxRead` (예: `PersonRead`, `PlaceRead`) — status, message, data를 감싸는 wrapper
- 응답 스키마에는 반드시 `model_config = ConfigDict(from_attributes=True)` 설정 (Pydantic v2)

### Service 함수 규칙
- 타입 힌트: 요청 데이터는 Pydantic 스키마 타입 (예: `PersonCreate`), 유저는 `User` 모델 타입
- `get_current_user`를 타입힌트로 쓰지 않는다. `User` 모델을 타입힌트로 사용
- DB 필터링 시 해당 테이블의 컬럼을 사용 (예: `People.user_id == user_id`, User.id가 아님)
- 전체 조회 시 `.all()` 사용, 단건 조회 시 `.first()` 사용

### API 라우터 규칙
- 인증이 필요한 API는 반드시 `current_user = Depends(get_current_user)` 파라미터 포함
- `get_current_user`는 `auth.token` 모듈에서 import
- `get_db`는 `config.database` 모듈에서 import

### 보안 규칙
- API 응답에 password를 절대 포함하지 않는다
- 로그인은 `OAuth2PasswordRequestForm` (form-data)으로 받는다
- 토큰 응답에는 반드시 `"token_type": "bearer"` 포함

## 인증 흐름

1. 회원가입/로그인 → JWT access_token 발급
2. 이후 API 요청 시 `Authorization: Bearer {token}` 헤더 포함
3. `get_current_user` (auth/token.py)가 토큰을 검증하고 User 객체 반환
4. `oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")` — Swagger Authorize 연동

## API 엔드포인트 목록

### 구현 완료
| API | Method | Endpoint | 설명 |
|-----|--------|----------|------|
| 회원가입 | POST | /auth/register | |
| 로그인 | POST | /auth/login | OAuth2 form-data |
| 친구 생성 | POST | /people/register/people | 인증 필요 |
| 친구 조회 | GET | /people/load/people | 인증 필요 |

### 미구현 (구현 예정)
| API | Method | Endpoint | 설명 |
|-----|--------|----------|------|
| 장소 생성 | POST | /place/create | 이름, 위도, 경도 직접 입력 |
| 장소 조회 | GET | /place/{place_id} | |
| 일정 생성 | POST | /sche/create | people_ids, place_id 연결 |
| 일정 조회 | GET | /sche/{schedule_id} | |
| 사진→자동기록 | POST | /schedules/{id}/complete | GPS 추출, 얼굴 매칭 |
| 친구 상세 | GET | /pp/look/{people_id} | 만남 기록 리스트 포함 |
| 장소 상세 | GET | /place/{place_id} | 방문 기록 리스트 포함 |
| 기록 상세 | GET | /pp/look/{log_id} | 사진, 함께한 사람 포함 |


## 현재 작업 중

- **스프린트 1-1**: Place CRUD (생성, 조회) 구현
- People 모듈의 패턴(model → schema → service → api)을 동일하게 따를 것
- main.py에 place_router를 등록해야 함

## 주의사항

- `datetime.utcnow()` 대신 `datetime.now(timezone.utc)` 사용 (Python 3.12 deprecation)
- SQLAlchemy 컬럼 타입은 `sqlalchemy.Float`, `sqlalchemy.String` 등 사용 (파이썬 내장 타입 X)
- `embedding` 필드는 현재 Optional로 처리 (얼굴 인식 기능은 추후 구현)
- 비밀번호 해싱은 추후 적용 예정 (현재 평문 저장)