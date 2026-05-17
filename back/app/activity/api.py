from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from activity.schema import ActivityRead, ConfirmRequest, PhotoUploadResponse, PhotoVerifyResponse
from activity.service import confirm_schedule, get_activity, upload_photos, verify_photo
from config.database import get_db
from auth.token import get_current_user

router = APIRouter(
    prefix="/activity",
    tags=["activity"]
)


@router.post("/upload-photos", response_model=PhotoUploadResponse)
async def upload_photos_route(
    photos: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    사진을 분석하여 EXIF 기반 그룹화 및 일정 매칭 결과를 반환한다.

    - 사진은 1~10장으로 제한 (범위 위반 시 400 에러 반환)
    - EXIF에서 날짜·GPS를 추출하여 날짜·반경 200m 기준으로 사진을 그룹화
    - AI 서버로 얼굴 감지·매칭을 1회 일괄 요청하여 그룹별로 집계
    - DB에는 저장하지 않으며 분석 결과만 반환
    """
    if len(photos) == 0:
        raise HTTPException(status_code=400, detail="사진을 1장 이상 업로드해주세요")
    if len(photos) > 10:
        raise HTTPException(status_code=400, detail="최대 10장까지 업로드 가능합니다")

    print(f"[API] upload_photos_route 시작 - 사진 수: {len(photos)}장")
    result = await upload_photos(db, photos, current_user)
    print(f"[API] upload_photos_route 완료 - 그룹 수: {len(result['results'])}, skipped: {result['skipped_count']}")
    return {
        "status": 200,
        "message": f"{len(result['results'])}개 그룹으로 분석되었습니다",
        "data": result["results"],
        "skipped_count": result["skipped_count"]
    }


@router.post("/confirm/{schedule_id}", response_model=ActivityRead)
async def confirm_schedule_route(
    schedule_id: int,
    memo: Optional[str] = Form(None),                        # 선택 메모
    photos: Optional[List[UploadFile]] = File(None),         # 선택 사진 (없어도 됨)
    matched_people_ids: str = Form("[]"),                    # 얼굴 매칭 결과 People ID 목록 (JSON 배열 문자열)
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    일정을 완료 처리하고 활동 기록(ActivityLog)을 생성한다.

    - Completed 상태이거나 미래 날짜의 일정은 확정 불가 (400 에러 반환)
    - 얼굴 매칭으로 식별된 People을 일정 참여자와 합산하여 중복 없이 기록
    - 사진이 첨부된 경우 EXIF GPS로 장소를 재확인 후 Cloudinary에 저장
    - 같은 날 이미 카운트된 인물·장소는 중복 카운트하지 않음
    """
    # UploadFile → bytes로 변환 후 서비스 레이어에 전달
    # 서비스는 파일 시스템을 알 필요 없이 bytes만 받음
    photo_bytes_list = []
    if photos:
        for photo in photos:
            photo_bytes_list.append(await photo.read())

    # Form으로 받은 JSON 문자열을 int 리스트로 파싱
    # 예: '[]' → [], '[1, 2, 3]' → [1, 2, 3]
    people_ids = json.loads(matched_people_ids)

    activity_log = confirm_schedule(db, schedule_id, memo, current_user, photo_bytes_list, people_ids)
    return {
        "status": 200,
        "message": "일정이 확정되고 활동 기록이 생성되었습니다",
        "data": activity_log
    }


@router.post("/verify-photo/{schedule_id}", response_model=PhotoVerifyResponse)
async def verify_photo_route(
    schedule_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    사진의 EXIF 정보를 일정의 날짜·위치와 비교하여 일치 여부를 반환한다.

    - 사진 EXIF 추출 실패 시 match=false로 반환 (예외 발생 없음)
    - 날짜 일치 및 일정 장소 반경 200m 이내를 모두 만족해야 match=true
    - 일정 장소가 설정되지 않은 경우 location_match=false
    """
    photo_bytes = await photo.read()
    return await verify_photo(db, schedule_id, photo_bytes, current_user)


@router.get("/{log_id}", response_model=ActivityRead)
def get_activity_route(
    log_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    특정 활동 로그의 상세 정보를 조회한다.

    - 현재 유저 소유의 활동 로그만 조회 가능
    - 로그를 찾을 수 없으면 404 에러 반환
    """
    activity_log = get_activity(db, log_id, current_user)
    return {
        "status": 200,
        "message": "Activity retrieved successfully",
        "data": activity_log
    }
