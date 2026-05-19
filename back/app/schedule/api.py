from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from schedule.schema import ScheduleCreate, ScheduleRead, ScheduleList, ScheduleUpdate
from schedule.service import create_schedule, get_schedule, scheList, serialize_schedule, update_schedule
from config.database import get_db
from auth.token import get_current_user

router = APIRouter(
    prefix="/sche",
    tags=["schedule"]
)


@router.post("/create", response_model=ScheduleRead)
def register_schedule(
    schedule_data: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    새 일정을 생성하고 장소·인물을 연결한다.

    - 입력된 날짜가 오늘 이후면 Planned, 과거면 Completed로 상태 자동 결정
    - 존재하지 않는 장소 또는 인물 ID가 포함되면 404 에러 반환
    """
    new_schedule = create_schedule(db, schedule_data, current_user)
    return {
        "status": 200,
        "message": "Schedule created successfully",
        "data": serialize_schedule(new_schedule)
    }



@router.get("/{schedule_id}", response_model=ScheduleRead)
def load_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    특정 일정의 상세 정보를 조회한다.

    - 현재 유저 소유의 일정만 조회 가능
    - Completed 상태 일정이면 같은 날짜·장소의 활동 로그에서 사진 목록을 함께 반환
    """
    schedule = get_schedule(db, schedule_id, current_user)
    return {
        "status": 200,
        "message": "Schedule retrieved successfully",
        "data": serialize_schedule(schedule)
    }

@router.patch("/{schedule_id}", response_model=ScheduleRead)
def edit_schedule(
    schedule_id: int,
    update_data: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Planned 상태의 일정을 수정한다.

    - Completed 일정은 수정 불가 (400 에러 반환)
    - 날짜 변경 시 오늘 기준으로 Planned/Completed 상태를 재계산
    - place_id를 0으로 보내면 장소 연결을 해제
    """
    updated = update_schedule(db, schedule_id, update_data, current_user)
    return {
        "status": 200,
        "message": "Schedule updated successfully",
        "data": serialize_schedule(updated)
    }


@router.get("/load/scheduleList", response_model=list[ScheduleList])
def load_scheduleList(
    db : Session = Depends(get_db),
    year : int = Query(...),
    month : int = Query(...),
    current_user = Depends(get_current_user)):
    """
    특정 연·월에 해당하는 일정 목록을 반환한다.

    - 연·월 쿼리 파라미터가 필수
    - 해당 월에 일정이 없으면 404 에러 반환
    """
    schelist = scheList(db, year, month, current_user)
    return schelist
