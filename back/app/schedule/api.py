from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from schedule.schema import ScheduleCreate, ScheduleRead, ScheduleList, GetScheduleList
from schedule.service import create_schedule, get_schedule, scheList
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
    new_schedule = create_schedule(db, schedule_data, current_user)
    return {
        "status": 200,
        "message": "Schedule created successfully",
        "data": new_schedule
    }



@router.get("/{schedule_id}", response_model=ScheduleRead)
def load_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    schedule = get_schedule(db, schedule_id, current_user)
    return {
        "status": 200,
        "message": "Schedule retrieved successfully",
        "data": schedule
    }

@router.get("load/scheduleList", response_model=list[ScheduleList])
def load_scheduleList(
    db : Session = Depends(get_db),
    year : int = Query(...),
    month : int = Query(...),
    current_user = Depends(get_current_user)):
    schelist = scheList(db, year, month, current_user)
    return schelist