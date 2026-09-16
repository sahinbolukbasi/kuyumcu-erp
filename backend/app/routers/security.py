import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from .. import models, schemas, auth, iot_service

router = APIRouter(prefix="/api/v1/security", tags=["İleri Güvenlik, Gece Koruma & Sahte Altın Kalkanı"])


def get_or_create_config(db: Session) -> models.SecuritySystemConfig:
    config = db.query(models.SecuritySystemConfig).first()
    if not config:
        config = models.SecuritySystemConfig(
            night_mode_active=False,
            night_mode_auto=True,
            two_man_rule_enabled=True,
            two_man_threshold=100000.0,
            fake_weight_tolerance_grams=0.25,
            silent_panic_active=False
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get("/config", response_model=schemas.SecurityConfigOut)
def get_security_config(db: Session = Depends(get_db)):
    """Sistem güvenlik ayarları"""
    return get_or_create_config(db)


@router.put("/config", response_model=schemas.SecurityConfigOut)
def update_security_config(
    payload: schemas.SecurityConfigUpdate,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Güvenlik ayarlarını güncelleme (Yalnızca Admin)"""
    config = get_or_create_config(db)
    if payload.night_mode_active is not None:
        config.night_mode_active = payload.night_mode_active
    if payload.night_mode_auto is not None:
        config.night_mode_auto = payload.night_mode_auto
    if payload.two_man_rule_enabled is not None:
        config.two_man_rule_enabled = payload.two_man_rule_enabled
    if payload.two_man_threshold is not None:
        config.two_man_threshold = payload.two_man_threshold
    if payload.fake_weight_tolerance_grams is not None:
        config.fake_weight_tolerance_grams = payload.fake_weight_tolerance_grams
    
    db.commit()
    db.refresh(config)
    return config


@router.post("/night-mode/toggle", response_model=schemas.SecurityConfigOut)
async def toggle_night_mode(
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Gece / Mağaza Kapalı Koruma Modunu açar veya kapatır"""
    config = get_or_create_config(db)
    config.night_mode_active = not config.night_mode_active
    
    user_name = current_user.full_name if current_user else "Yönetici"
    state_str = "DEVREDE (Mağaza Kilitli)" if config.night_mode_active else "PASİF (Mesai Açık)"

    event = models.SecurityEventLog(
        event_type="NIGHT_BURGLARY" if config.night_mode_active else "BIOMETRIC_ACCESS",
        severity="WARNING" if config.night_mode_active else "INFO",
        title=f"Gece Koruma Modu: {state_str}",
        details=f"Güvenlik modu {user_name} tarafından {state_str} konumuna alındı.",
        user_name=user_name,
        is_resolved=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(config)

    # WebSocket bildirim
    await iot_service.manager.broadcast({
        "type": "NIGHT_MODE_UPDATED",
        "night_mode_active": config.night_mode_active,
        "message": f"Gece Güvenlik Modu: {state_str}"
    })

    return config


@router.post("/panic-button", response_model=schemas.SecurityEventLogOut)
async def trigger_silent_panic_button(
    payload: schemas.PanicTriggerRequest,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Gizli / Ayak Altı Panik Butonu (Sessiz Alarm)"""
    config = get_or_create_config(db)
    config.silent_panic_active = True
    config.last_panic_triggered_at = datetime.datetime.utcnow()

    user_name = current_user.full_name if current_user else "Personel (Gizli Buton)"

    event = models.SecurityEventLog(
        event_type="PANIC_ALARM",
        severity="CRITICAL",
        title="🚨 SESSİZ PANİK ALARMI TETİKLENDİ!",
        details=f"{payload.trigger_source}: {payload.details} - Bildirim güvenlik merkezine iletildi.",
        user_name=user_name,
        is_resolved=False,
        created_at=datetime.datetime.utcnow()
    )
    db.add(event)

    # Sistem loguna da ekle
    sys_log = models.SystemLog(
        level="SECURITY",
        module="SECURITY",
        message="SESSİZ PANİK BUTONU TETİKLENDİ - ACİL MÜDAHALE ÇAĞRISI",
        user_name=user_name
    )
    db.add(sys_log)

    db.commit()
    db.refresh(event)

    # WebSocket ile anons et
    await iot_service.manager.broadcast({
        "type": "PANIC_ALARM",
        "event_id": event.id,
        "severity": "CRITICAL",
        "title": "🚨 SESSİZ PANİK ALARMI AKTİF",
        "details": event.details
    })

    return event


@router.post("/verify-weight-anomaly")
async def verify_weight_anomaly(
    payload: schemas.WeightAnomalyCheckRequest,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Ürün vitrine iade edildiğinde sahte altın / ikame sapması tespiti"""
    config = get_or_create_config(db)
    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    ref_weight = product.weight_grams
    ret_weight = payload.returned_weight_grams
    diff = round(abs(ret_weight - ref_weight), 2)
    max_tol = config.fake_weight_tolerance_grams or 0.25

    is_anomaly = diff > max_tol

    if is_anomaly:
        user_name = current_user.full_name if current_user else "Sistem Sensörü"
        event = models.SecurityEventLog(
            event_type="WEIGHT_ANOMALY",
            severity="CRITICAL",
            title=f"⚠️ ŞÜPHELİ AĞIRLIK SAPMASI (Sahte Ürün / İkame Şüphesi)",
            details=f"Ürün: {product.name} (Ref: {ref_weight}g) | Geri Konulan: {ret_weight}g | Fark: {diff}g (Tolerans: {max_tol}g aşıldı!)",
            slot_number=product.slot.slot_number if product.slot else None,
            user_name=user_name,
            is_resolved=False,
            created_at=datetime.datetime.utcnow()
        )
        db.add(event)
        db.commit()

        await iot_service.manager.broadcast({
            "type": "WEIGHT_ANOMALY",
            "product_id": product.id,
            "product_name": product.name,
            "diff_grams": diff,
            "ref_weight": ref_weight,
            "returned_weight": ret_weight
        })

        return {
            "status": "ANOMALY_DETECTED",
            "is_anomaly": True,
            "difference_grams": diff,
            "message": f"DİKKAT! Ürün ağırlığı referanstan {diff}g farklı! İkame veya benzer parça şüphesi.",
            "event_id": event.id
        }

    return {
        "status": "OK",
        "is_anomaly": False,
        "difference_grams": diff,
        "message": "Ürün ağırlığı referans değer ile tam uyumlu."
    }


@router.get("/events", response_model=List[schemas.SecurityEventLogOut])
def get_security_events(
    severity: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Güvenlik olayları, kilit logları ve panik kayıtları"""
    query = db.query(models.SecurityEventLog)
    if severity and severity != "ALL":
        query = query.filter(models.SecurityEventLog.severity == severity)
    return query.order_by(desc(models.SecurityEventLog.created_at)).limit(30).all()


@router.post("/events/{event_id}/resolve")
def resolve_security_event(
    event_id: int,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Güvenlik uyarısını inceleyip çözüldü olarak işaretler"""
    event = db.query(models.SecurityEventLog).filter(models.SecurityEventLog.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Güvenlik olayı bulunamadı")

    user_name = current_user.full_name if current_user else "Yönetici"
    event.is_resolved = True
    event.resolved_by = user_name
    event.resolved_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Güvenlik olayı başarıyla kapatıldı."}
