from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from activity.schema import ActivityCreate, ActivityRead, ConfirmRequest
from activity.service import confirm_schedule, create_activity_direct, get_activity
from config.database import get_db
from auth.token import get_current_user

router = APIRouter(
    prefix="/activity",
    tags=["activity"]
)


@router.post("/confirm/{schedule_id}", response_model=ActivityRead)
def confirm_schedule_route(
    schedule_id: int,
    request: ConfirmRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    activity_log = confirm_schedule(db, schedule_id, request.memo, current_user)
    return {
        "status": 200,
        "message": "일정이 확정되고 활동 기록이 생성되었습니다",
        "data": activity_log
    }


@router.post("/create", response_model=ActivityRead)
def create_activity_route(
    activity_data: ActivityCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    activity_log = create_activity_direct(db, activity_data, current_user)
    return {
        "status": 200,
        "message": "Activity created successfully",
        "data": activity_log
    }


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
