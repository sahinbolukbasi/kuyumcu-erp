import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import SystemLog
from ..schemas import SystemLogOut, SystemLogCreate
from ..auth import get_current_user

router = APIRouter(prefix="/api/v1/logs", tags=["Sistem Denetim Günlüğü (Audit Logs)"])

@router.get("", response_model=List[SystemLogOut])
def get_system_logs(
    level: Optional[str] = None,
    module: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(SystemLog)
    if level and level != "ALL":
        query = query.filter(SystemLog.level == level)
    if module and module != "ALL":
        query = query.filter(SystemLog.module == module)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (SystemLog.message.ilike(search_fmt)) |
            (SystemLog.user_name.ilike(search_fmt)) |
            (SystemLog.details_json.ilike(search_fmt))
        )
    return query.order_by(desc(SystemLog.created_at)).offset(skip).limit(limit).all()

@router.post("", response_model=SystemLogOut)
def create_system_log(
    log_in: SystemLogCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    log = SystemLog(
        level=log_in.level,
        module=log_in.module,
        message=log_in.message,
        details_json=log_in.details_json,
        ip_address=log_in.ip_address,
        user_id=current_user.id if current_user else None,
        user_name=current_user.full_name if current_user else None
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
