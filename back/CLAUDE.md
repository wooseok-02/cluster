# CLUSTER 프로젝트

> 사진 기반 인생 인프라 구축 서비스 — 사진 속 인물/장소를 자동 분석하여 인간관계와 장소 기록을 체계적으로 관리

## 기술 스택

- **Framework**: FastAPI (0.128.8)
- **ORM**: SQLAlchemy (2.0.46)
- **DB**: SQLite (개발), `check_same_thread=False` 설정
- **인증**: JWT (python-jose), OAuth2PasswordBearer
- **Validation**: Pydantic v2 (2.12.5), pydantic-settings
- **환경변수**: python-dotenv, `.env` 파일로 관리
- **이미지 처리**: Pillow (12.1.1) — EXIF GPS 추출
- **외부 API**: Kakao Map REST API — 키워드 장소 검색, 역지오코딩
- **Python**: 3.12.9

## 프로젝트 구조

```
back/app/
├── main.py                 # FastAPI 앱 생성, 라우터 등록
├── config/
│   ├── config.py           # Settings (환경변수: SECRET_KEY, ALGORITHM, DATABASE_URL, KAKAO_REST_API_KEY 등)
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
│   ├── model.py            # Place 모델
│   ├── schema.py           # PlaceCreate, PlaceData, PlaceRead
│   ├── service.py          # create_place, create_place_from_photo, get_place, _extract_gps_from_exif
│   └── api.py              # /place/create, /place/create/photo, /place/{place_id}
├── schedule/
│   ├── model.py            # Schedule 모델 + SCHEDULE_PEOPLE 매핑 테이블
│   ├── schema.py           # ScheduleCreate, ScheduleData, ScheduleRead
│   ├── service.py          # create_schedule, get_schedule
│   └── api.py              # /sche/create, /sche/{schedule_id}
└── activity/
    ├── model.py            # ActivityLog 모델 + LOG_PEOPLE 매핑 테이블 + Photo 모델
    ├── schema.py           # ActivityCreate, ActivityData, ActivityRead, ConfirmRequest
    ├── service.py          # confirm_schedule, create_activity_direct, get_activity
    └── api.py              # /activity/confirm/{schedule_id}, /activity/create, /activity/{log_id}
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
| count | Integer | default=0, 만남 확정 시 +1 |
| status | String | default="new" (new/regular/best/alert) |
| embedding | LargeBinary | 얼굴 임베딩 (Optional, 추후 구현) |
| user_id | Integer | FK → USER.id |

### PLACE
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | Integer | PK |
| name | String | |
| longitude | Float | |
| latitude | Float | |
| visit_count | Integer | default=1, 만남 확정 시 +1 |
| status | String | default="new" |
| user_id | Integer | FK → USER.id |

### SCHEDULE
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | Integer | PK |
| user_id | Integer | FK → USER.id |
| place_id | Integer | FK → PLACE.id (Optional) |
| title | String | |
| start_time | DateTime | date + start_time 조합 |
| end_time | DateTime | date + end_time 조합 |
| memo | String | |
| status | String | "Planned" / "Completed" |

### SCHEDULE_PEOPLE (다대다 — 계획 단계)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| schedule_id | Integer | FK → SCHEDULE.id |
| people_id | Integer | FK → PEOPLE.id |

### ACTIVITY_LOG
| 컬럼 | 타입 | 비고 |
|------|------|------|
| log_id | Integer | PK |
| user_id | Integer | FK → USER.id |
| place_id | Integer | FK → PLACE.id (nullable) |
| date | Date | |
| time | Time | |
| memo | String | |

### LOG_PEOPLE (다대다 — 확정된 기록)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| log_id | Integer | FK → ACTIVITY_LOG.log_id |
| people_id | Integer | FK → PEOPLE.id |

### PHOTO
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | Integer | PK |
| log_id | Integer | FK → ACTIVITY_LOG.log_id |
| photo_url | String | |

## 매핑 테이블 설계 원칙

- **SCHEDULE_PEOPLE**: 계획 단계에서 "함께할 예정인 사람들" 연결
- **LOG_PEOPLE**: 확정된 기록에서 "실제로 함께한 사람들" 연결
- Schedule 확정(confirm) 시 SCHEDULE_PEOPLE의 목록이 LOG_PEOPLE로 복사됨
- 두 테이블은 역할이 다르므로 반드시 분리 유지

## 비즈니스 규칙 (반드시 준수)

### 기록의 진실성 (Authenticity Guard)
- 미래 날짜의 일정은 "Planned" 상태, 사진 업로드 불가, 완료(confirm) 불가
- 과거/오늘 날짜의 일정만 "Completed"로 전환 가능
- count/visit_count는 confirm 또는 activity 생성 시에만 증가

### 인물/장소 등록 원칙
- Schedule이나 Activity에 넣는 people_ids는 반드시 이미 People 테이블에 등록된 사람만 허용
- 존재하지 않는 people_id가 들어오면 에러 + "먼저 인물을 등록해주세요" 안내
- place_id도 마찬가지 — 현재 유저 소유의 등록된 장소만 허용

### count 자동 정산
- Schedule 확정(confirm_schedule) 시: 연결된 People 각각 count += 1, Place visit_count += 1
- Activity 직접 생성(create_activity_direct) 시: 동일하게 count += 1, visit_count += 1
- 이중 확정 방어: 이미 "Completed"인 Schedule은 다시 확정 불가

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
- 존재하지 않는 people_id/place_id 검증 시 missing_ids를 에러 응답에 포함

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
| 장소 생성 (수동) | POST | /place/create | 이름, 위도, 경도 직접 입력 |
| 장소 생성 (사진) | POST | /place/create/photo | 사진 EXIF GPS 추출 |
| 장소 조회 | GET | /place/{place_id} | |
| 일정 생성 | POST | /sche/create | people_ids, place_id 연결, 날짜 기반 status 자동 결정 |
| 일정 조회 | GET | /sche/{schedule_id} | place, people 정보 포함 |
| 일정 확정 → 기록 전환 | POST | /activity/confirm/{schedule_id} | Schedule → ActivityLog 전환, count 정산 |
| 활동 직접 생성 | POST | /activity/create | Schedule 없이 기록 생성 |
| 활동 조회 | GET | /activity/{log_id} | place, people, photos 포함 |

### 미구현 (구현 예정)
| API | Method | Endpoint | 설명 |
|-----|--------|----------|------|
| 장소 생성 (키워드 검색) | POST | /place/create/search | Kakao Map API로 장소명 검색 → 좌표 자동 입력 |
| 사진 → 자동 일정 매칭 | POST | /activity/upload-photo | GPS 추출 → Place 매칭 → Schedule 매칭 → Activity 생성 |
| 친구 상세 (기록 포함) | GET | /people/{people_id}/detail | 만남 기록 리스트 포함 |
| 장소 상세 (기록 포함) | GET | /place/{place_id}/detail | 방문 기록 리스트 포함 |

## 현재 스프린트

- **스프린트 2-3**: Kakao Map API 연동 — 장소 이름 검색으로 Place 생성 (위도/경도 직접 입력 대체)
- **스프린트 2-4**: 사진 업로드 → GPS 추출 → Place 매칭 → Schedule 매칭 → Activity 자동 생성 (Flow 4)
- **스프린트 3**: 프론트 화면 구축 (People 탭, Map 탭, Calendar 탭)
- **스프린트 4**: 얼굴 임베딩, status 자동 변경, AI 선제 가이드

## 외부 API 연동 가이드

### Kakao Map REST API
- API 키: `.env` 파일의 `KAKAO_REST_API_KEY`에 저장
- config/config.py의 Settings 클래스에 `KAKAO_REST_API_KEY: str` 추가
- 요청 헤더: `Authorization: KakaoAK {REST_API_KEY}`
- 키워드 장소 검색: `GET https://dapi.kakao.com/v2/local/search/keyword.json?query={검색어}`
- 역지오코딩(좌표→주소): `GET https://dapi.kakao.com/v2/local/geo/coord2address.json?x={경도}&y={위도}`
- HTTP 클라이언트: `httpx` (비동기) 또는 `requests` (동기) 사용

## 주의사항

- `datetime.utcnow()` 대신 `datetime.now(timezone.utc)` 사용 (Python 3.12 deprecation)
- SQLAlchemy 컬럼 타입은 `sqlalchemy.Float`, `sqlalchemy.String` 등 사용 (파이썬 내장 타입 X)
- `embedding` 필드는 현재 Optional로 처리 (얼굴 인식 기능은 추후 구현)
- 비밀번호 해싱은 추후 적용 예정 (현재 평문 저장)
- 사진 업로드 시 UploadFile + Form 조합은 `python-multipart` 패키지 필요 (이미 설치됨)
- GPS DMS(도분초) → 십진수 변환 함수는 place/service.py의 _extract_gps_from_exif에 구현됨