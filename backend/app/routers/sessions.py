import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/v1/sessions", tags=["Personel Müşteri Seansı & Eksik Model Takibi"])

@router.post("/start", response_model=schemas.ServiceSessionOut)
def start_service_session(
    payload: schemas.ServiceSessionStart,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Personel bir müşteriyle ilgilenmeye başladığında seans açılır (Kronometre başlar)"""
    acting_user = current_user
    if not acting_user and payload.user_id:
        acting_user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not acting_user:
        acting_user = db.query(models.User).filter(models.User.role == "STAFF").first() or db.query(models.User).first()

    user_id = acting_user.id if acting_user else 1
    user_name = acting_user.full_name if acting_user else "Personel"

    session = models.ServiceSession(
        user_id=user_id,
        customer_name=payload.customer_name or "Müşteri",
        started_at=datetime.datetime.utcnow(),
        sale_made=False
    )
    db.add(session)
    
    log = models.SystemLog(
        level="INFO",
        module="CRM",
        message=f"Müşteri hizmet seansı başladı: {user_name} -> {session.customer_name}",
        user_id=user_id,
        user_name=user_name
    )
    db.add(log)

    db.commit()
    db.refresh(session)
    return session


@router.post("/end", response_model=schemas.ServiceSessionOut)
def end_service_session(
    payload: schemas.ServiceSessionEnd,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Hizmet seansını bitirme: Süre hesaplanır, eksik model notu ve detaylar kaydedilir"""
    acting_user = current_user
    if not acting_user and payload.user_id:
        acting_user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not acting_user:
        acting_user = db.query(models.User).filter(models.User.role == "STAFF").first() or db.query(models.User).first()

    user_id = acting_user.id if acting_user else 1
    user_name = acting_user.full_name if acting_user else "Personel"

    session = None
    if payload.session_id:
        session = db.query(models.ServiceSession).filter(models.ServiceSession.id == payload.session_id).first()
    
    # Eğer aktif açık seans aranıyorsa
    if not session:
        session = db.query(models.ServiceSession).filter(
            models.ServiceSession.user_id == user_id,
            models.ServiceSession.ended_at.is_(None)
        ).order_by(desc(models.ServiceSession.started_at)).first()

    now = datetime.datetime.utcnow()
    if not session:
        # Seans kaydı yoksa yeni tamamlanmış olarak oluştur
        duration = float(payload.duration_minutes or 5.0)
        started = now - datetime.timedelta(minutes=duration)
        session = models.ServiceSession(
            user_id=user_id,
            customer_name=payload.customer_name or "Müşteri",
            started_at=started,
            ended_at=now,
            duration_minutes=duration,
            sale_made=payload.sale_made,
            missing_model_notes=payload.missing_model_notes,
            notes=payload.notes
        )
        db.add(session)
    else:
        session.ended_at = now
        diff_seconds = (now - session.started_at).total_seconds()
        calculated_minutes = round(diff_seconds / 60.0, 1)
        session.duration_minutes = float(payload.duration_minutes) if payload.duration_minutes and payload.duration_minutes > 0 else calculated_minutes
        session.sale_made = payload.sale_made
        if payload.customer_name:
            session.customer_name = payload.customer_name
        if payload.missing_model_notes:
            session.missing_model_notes = payload.missing_model_notes
        if payload.notes:
            session.notes = payload.notes

    # Eğer eksik model notu girildiyse bunu kayıp talep tablosuna da kaydet
    if payload.missing_model_notes:
        demand_note = models.LostDemandNote(
            user_id=user_id,
            user_name=user_name,
            requested_model=payload.missing_model_notes,
            notes=payload.notes
        )
        db.add(demand_note)

    log = models.SystemLog(
        level="INFO",
        module="CRM",
        message=f"Hizmet seansı tamamlandı: {user_name} ({session.duration_minutes} dk) | Satış: {'Evet' if session.sale_made else 'Hayır'} | Not: {session.missing_model_notes or 'Yok'}",
        user_id=user_id,
        user_name=user_name
    )
    db.add(log)

    db.commit()
    db.refresh(session)
    return session


@router.post("/lost-demand", response_model=schemas.LostDemandNoteOut)
def record_lost_demand(
    payload: schemas.LostDemandNoteCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Müşterinin sorup mağazada bulamadığı model kaydı (Eksik Model Notu)"""
    note = models.LostDemandNote(
        user_id=current_user.id,
        user_name=current_user.full_name,
        requested_model=payload.requested_model,
        category=payload.category,
        purity=payload.purity,
        approx_budget=payload.approx_budget,
        notes=payload.notes
    )
    db.add(note)
    
    log = models.SystemLog(
        level="WARNING",
        module="INVENTORY",
        message=f"Eksik Model Talebi kaydedildi: {payload.requested_model} ({payload.category} - {payload.purity}) -> Danışman: {current_user.full_name}",
        user_id=current_user.id,
        user_name=current_user.full_name
    )
    db.add(log)

    db.commit()
    db.refresh(note)
    return note


@router.get("/lost-demand", response_model=List[schemas.LostDemandNoteOut])
def list_lost_demands(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Mağazada bulunamayan / müşterilerin talep ettiği modeller listesi"""
    return db.query(models.LostDemandNote).order_by(desc(models.LostDemandNote.created_at)).limit(limit).all()


@router.get("/analytics")
def get_service_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Personel hizmet süreleri, müşteri seans sayıları ve eksik modeller özeti"""
    users = db.query(models.User).all()
    staff_stats = []

    for u in users:
        sessions = db.query(models.ServiceSession).filter(models.ServiceSession.user_id == u.id).all()
        total_sessions = len(sessions)
        total_mins = sum(s.duration_minutes for s in sessions)
        avg_mins = round(total_mins / total_sessions, 1) if total_sessions > 0 else 0.0
        sales_count = sum(1 for s in sessions if s.sale_made)

        staff_stats.append({
            "user_id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "total_customers_served": total_sessions,
            "total_service_minutes": round(total_mins, 1),
            "avg_service_minutes": avg_mins,
            "sales_conversion_count": sales_count
        })

    recent_missing_models = db.query(models.LostDemandNote).order_by(desc(models.LostDemandNote.created_at)).limit(20).all()
    missing_list = []
    for m in recent_missing_models:
        missing_list.append({
            "id": m.id,
            "requested_model": m.requested_model,
            "category": m.category,
            "purity": m.purity,
            "notes": m.notes,
            "user_name": m.user_name,
            "created_at": m.created_at.strftime("%d.%m.%Y %H:%M")
        })

    return {
        "staff_stats": staff_stats,
        "missing_models": missing_list
    }
