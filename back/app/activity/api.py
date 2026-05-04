from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

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
    if len(photos) == 0:
        raise HTTPException(status_code=400, detail="사진을 1장 이상 업로드해주세요")
    if len(photos) > 10:
        raise HTTPException(status_code=400, detail="최대 10장까지 업로드 가능합니다")

    result = await upload_photos(db, photos, current_user)
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
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # UploadFile → bytes로 변환 후 서비스 레이어에 전달
    # 서비스는 파일 시스템을 알 필요 없이 bytes만 받음
    photo_bytes_list = []
    if photos:
        for photo in photos:
            photo_bytes_list.append(await photo.read())

    activity_log = confirm_schedule(db, schedule_id, memo, current_user, photo_bytes_list)
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
    photo_bytes = await photo.read()
    return verify_photo(db, schedule_id, photo_bytes, current_user)


@router.get("/{log_id}", response_model=ActivityRead)
def get_activity_route(
    log_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    activity_log = get_activity(db, log_id, current_user)
    return {
        "status": 200,
        "message": "Activity retrieved successfully",
        "data": activity_log
    }
