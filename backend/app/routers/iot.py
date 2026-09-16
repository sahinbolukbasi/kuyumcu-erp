import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from .. import models, schemas, iot_service, auth

router = APIRouter(prefix="/api/v1/iot", tags=["IoT, Tablalar & Askılar"])

@router.get("/slots", response_model=List[schemas.RackSlotOut])
def list_slots(
    group_name: Optional[str] = None,
    slot_type: Optional[str] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.RackSlot)
    if branch_id and branch_id > 0:
        query = query.filter(models.RackSlot.branch_id == branch_id)
    if group_name and group_name != "ALL":
        query = query.filter(models.RackSlot.group_name == group_name)
    if slot_type and slot_type != "ALL":
        query = query.filter(models.RackSlot.slot_type == slot_type)

    slots = query.order_by(models.RackSlot.slot_number.asc()).all()
    
    # Her slot için beklenen ağırlığı o askıdaki Vitrinde olan ürünlerin toplamı olarak doğrula
    for s in slots:
        active_prods = [p for p in s.products if p.status == "Vitrinde"]
        total_w = sum(p.weight_grams for p in active_prods)
        if s.status != "ALERT" and s.expected_weight != total_w:
            s.expected_weight = round(total_w, 2)
            if s.current_weight == 0 and total_w > 0:
                s.current_weight = round(total_w, 2)

    return slots


@router.get("/groups", response_model=List[str])
def list_slot_groups(db: Session = Depends(get_db)):
    groups = db.query(models.RackSlot.group_name).distinct().all()
    group_list = [g[0] for g in groups if g[0]]
    if not group_list:
        group_list = ["Ana Vitrin", "Yüzük Tablası 1", "Bilezik Standı", "Çelik Kasa"]
    return sorted(list(set(group_list)))


@router.api_route("/slots/{slot_id}/identify-lift", methods=["GET", "POST"], response_model=schemas.IdentifyLiftResponse)
def identify_lift_candidates(
    slot_id: int,
    weight_lost: Optional[float] = Query(None),
    payload: Optional[dict] = Body(None),
    db: Session = Depends(get_db)
):
    """Askıdan ağırlık eksildiğinde o askıdaki modeller arasından eksilen gramaja en uygun olanları listeleme"""
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    lost = weight_lost
    if (lost is None or lost <= 0) and payload and "weight_lost" in payload:
        lost = float(payload["weight_lost"])
    if lost is None or lost <= 0:
        lost = max(0.0, slot.expected_weight - slot.current_weight)

    candidates = []
    # Askıda Vitrinde olan ürünler
    active_products = [p for p in slot.products if p.status == "Vitrinde"]
    
    # Eğer aktif ürün yoksa tüm ürünlere bak
    if not active_products:
        active_products = db.query(models.Product).filter(models.Product.status == "Vitrinde").all()

    for p in active_products:
        diff = abs(p.weight_grams - lost)
        # Güven skoru hesabı (Fark ne kadar azsa güven o kadar yüksek)
        if diff <= 0.2:
            score = 98
        elif diff <= 0.5:
            score = 90
        elif diff <= 1.0:
            score = 80
        elif diff <= 2.5:
            score = 65
        else:
            score = max(10, int(100 - (diff * 10)))

        candidates.append({
            "product_id": p.id,
            "product_name": p.name,
            "barcode": p.barcode,
            "purity": p.purity,
            "weight_grams": p.weight_grams,
            "price": p.price,
            "image_url": p.image_url,
            "diff_grams": round(diff, 2),
            "confidence_score": score
        })

    # En yakın gramajdakini en üste sırala
    candidates.sort(key=lambda x: x["diff_grams"])

    return {
        "slot_number": slot.slot_number,
        "slot_id": slot.id,
        "weight_lost": round(lost, 2),
        "candidates": candidates
    }


@router.post("/custody/take")
async def take_into_custody(
    req: schemas.CustodyTakeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Personel askıdan çıkan ürünü onaylar -> Ürün personelin zimmetine / masasına geçer, alarm susar"""
    product = db.query(models.Product).filter(models.Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    slot = db.query(models.RackSlot).filter(models.RackSlot.id == req.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    # Kullanıcı tespiti (JWT veya user_id fallback)
    acting_user = current_user
    if not acting_user and req.user_id:
        acting_user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not acting_user:
        acting_user = db.query(models.User).filter(models.User.role == "STAFF").first() or db.query(models.User).first()

    user_id = acting_user.id if acting_user else 1
    user_name = acting_user.full_name if acting_user else "Personel"

    # Ürünü personelin zimmetine al
    product.status = "Zimmette"
    product.custody_user_id = user_id
    product.custody_started_at = datetime.datetime.utcnow()
    product.view_count = (product.view_count or 0) + 1

    # Askının beklenen ağırlığından bu ürünün ağırlığını düş
    slot.expected_weight = max(0.0, round(slot.expected_weight - product.weight_grams, 2))
    slot.current_weight = slot.expected_weight
    slot.status = "NORMAL" if slot.expected_weight > 0 else "EMPTY"

    # Bu askının aktif alarmı varsa otomatik çöz
    active_alerts = db.query(models.SecurityAlert).filter(
        models.SecurityAlert.slot_id == slot.id,
        models.SecurityAlert.is_resolved == False
    ).all()
    for alert in active_alerts:
        alert.is_resolved = True
        alert.resolved_by = f"ZİMMET ({user_name})"
        alert.resolved_at = datetime.datetime.utcnow()

    # İnceleme logu oluştur
    inspection = models.InspectionLog(
        product_id=product.id,
        slot_id=slot.id,
        lifted_at=datetime.datetime.utcnow(),
        was_authorized=True
    )
    db.add(inspection)

    # Audit log
    log = models.SystemLog(
        level="INFO",
        module="IOT",
        message=f"Ürün zimmete alındı (Masada denetiliyor): {product.name} ({product.weight_grams}g) -> Danışman: {user_name}",
        user_id=user_id,
        user_name=user_name,
        details_json=json.dumps({
            "product_id": product.id,
            "slot_number": slot.slot_number,
            "weight": product.weight_grams
        })
    )
    db.add(log)

    db.commit()
    db.refresh(product)
    db.refresh(slot)

    # WebSocket ile anons et
    await iot_service.manager.broadcast({
        "type": "CUSTODY_TAKEN",
        "product_id": product.id,
        "product_name": product.name,
        "weight_grams": product.weight_grams,
        "slot_id": slot.id,
        "slot_number": slot.slot_number,
        "custody_user_id": user_id,
        "custody_user_name": user_name,
        "new_expected_weight": slot.expected_weight
    })

    return {
        "status": "success",
        "message": f"{product.name} başarıyla zimmetinize alındı ve alarm susturuldu.",
        "product_id": product.id,
        "custody_user": user_name
    }


@router.post("/custody/return-to-rack")
async def return_to_rack(
    req: schemas.CustodyReturnRequest,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Müşteri ürünü almaktan vazgeçtiğinde ürünü tekrar askıya / vitrine geri koyma"""
    product = db.query(models.Product).filter(models.Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    slot = product.slot
    if not slot:
        slot = db.query(models.RackSlot).filter(models.RackSlot.slot_number == 1).first()

    acting_user = current_user
    if not acting_user:
        acting_user = db.query(models.User).filter(models.User.role == "STAFF").first() or db.query(models.User).first()
    user_name = acting_user.full_name if acting_user else "Personel"

    # İnceleme süresi hesapla
    duration = 0
    if product.custody_started_at:
        duration = int((datetime.datetime.utcnow() - product.custody_started_at).total_seconds())
    minutes_str = f"{duration // 60} dk {duration % 60} sn" if duration >= 60 else f"{duration} sn"

    # Durumu vitrine geri çevir
    product.status = "Vitrinde"
    product.custody_user_id = None
    product.custody_started_at = None

    # Askının beklenen ağırlığına geri ekle
    slot.expected_weight = round(slot.expected_weight + product.weight_grams, 2)
    slot.current_weight = slot.expected_weight
    slot.status = "NORMAL"

    # Audit log
    log = models.SystemLog(
        level="INFO",
        module="IOT",
        message=f"Ürün masadan vitrine geri koyuldu: {product.name} (Askı #{slot.slot_number}) - İnceleme süresi: {minutes_str}",
        user_id=acting_user.id if acting_user else 1,
        user_name=user_name,
        details_json=json.dumps({
            "product_id": product.id,
            "slot_number": slot.slot_number,
            "duration_seconds": duration
        })
    )
    db.add(log)

    db.commit()
    db.refresh(product)
    db.refresh(slot)

    await iot_service.manager.broadcast({
        "type": "CUSTODY_RETURNED",
        "product_id": product.id,
        "product_name": product.name,
        "slot_id": slot.id,
        "slot_number": slot.slot_number,
        "new_expected_weight": slot.expected_weight,
        "duration_seconds": duration
    })

    return {
        "status": "success",
        "message": f"{product.name} vitrine geri yerleştirildi (İnceleme Süresi: {minutes_str}).",
        "slot_number": slot.slot_number
    }


@router.get("/custody/my-items", response_model=List[schemas.ProductOut])
def get_my_custody_items(
    user_id: Optional[int] = Query(None),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Personelin şu anda elinde / masasında denettiği ürünler"""
    target_user_id = None
    if current_user:
        target_user_id = current_user.id
    elif user_id:
        target_user_id = user_id

    query = db.query(models.Product).filter(models.Product.status == "Zimmette")
    if target_user_id:
        query = query.filter(models.Product.custody_user_id == target_user_id)
    items = query.all()
    return items


@router.post("/slots/{slot_id}/assign")
async def assign_product_to_slot(
    slot_id: int,
    payload: schemas.SlotAssignRequest,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    if payload.action == "ADD":
        product.slot_id = slot.id
        product.status = "Vitrinde"
        msg = f"Ürün askıya eklendi: {product.name} ({product.weight_grams}g) -> #{slot.slot_number} {slot.label}"
    else:
        product.slot_id = None
        product.status = "Kasada"
        msg = f"Ürün askıdan çıkarıldı: {product.name} -> Kasaya alındı"

    db.flush()
    # Slot beklenen ağırlığını güncelle
    active_prods = db.query(models.Product).filter(
        models.Product.slot_id == slot.id,
        models.Product.status == "Vitrinde"
    ).all()
    total_w = sum(p.weight_grams for p in active_prods)
    slot.expected_weight = round(total_w, 2)
    slot.current_weight = round(total_w, 2)
    slot.status = "NORMAL" if total_w > 0 else "EMPTY"

    log = models.SystemLog(
        level="INFO",
        module="INVENTORY",
        message=msg,
        user_id=admin.id,
        user_name=admin.full_name
    )
    db.add(log)
    db.commit()

    await iot_service.manager.broadcast({
        "type": "SLOT_ASSIGNED",
        "slot_number": slot.slot_number,
        "slot_id": slot.id,
        "expected_weight": slot.expected_weight,
        "current_weight": slot.current_weight
    })

    return {"message": msg, "slot_id": slot.id, "product_id": product.id, "total_weight": slot.expected_weight}


@router.post("/slots", response_model=schemas.RackSlotOut)
def create_slot(
    slot_in: schemas.SlotCreateRequest,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(models.RackSlot).filter(models.RackSlot.slot_number == slot_in.slot_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu slot numarası ile kayıtlı bir cihaz zaten var.")

    slot = models.RackSlot(
        slot_number=slot_in.slot_number,
        label=slot_in.label,
        slot_type=slot_in.slot_type or "Askı",
        group_name=slot_in.group_name or "Ana Vitrin",
        device_id=slot_in.device_id,
        ip_address=slot_in.ip_address,
        port=slot_in.port,
        tolerance_grams=slot_in.tolerance_grams,
        is_online=True,
        expected_weight=0.0,
        current_weight=0.0,
        status="EMPTY"
    )
    db.add(slot)
    
    log = models.SystemLog(
        level="INFO",
        module="IOT",
        message=f"Yeni IoT Cihazı tanımlandı: #{slot.slot_number} - {slot.label} ({slot.group_name})",
        user_id=admin.id,
        user_name=admin.full_name
    )
    db.add(log)
    
    db.commit()
    db.refresh(slot)
    return slot


@router.put("/slots/{slot_id}/device-config", response_model=schemas.RackSlotOut)
def update_slot_device_config(
    slot_id: int,
    config: schemas.SlotDeviceConfigUpdate,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı/Tabla bulunamadı")

    if config.label is not None:
        slot.label = config.label
    if config.slot_type is not None:
        slot.slot_type = config.slot_type
    if config.group_name is not None:
        slot.group_name = config.group_name
    if config.ip_address is not None:
        slot.ip_address = config.ip_address
    if config.port is not None:
        slot.port = config.port
    if config.tolerance_grams is not None:
        slot.tolerance_grams = config.tolerance_grams

    slot.last_ping = datetime.datetime.utcnow()
    db.commit()
    db.refresh(slot)
    return slot


@router.post("/telemetry")
async def receive_telemetry(payload: schemas.TelemetryPayload, db: Session = Depends(get_db)):
    result = await iot_service.process_telemetry(
        db=db,
        slot_number=payload.slot_number,
        current_weight=payload.weight_grams,
        device_id=payload.device_id
    )
    return {"status": "success", "data": result}


@router.get("/demand-analytics")
def get_demand_analytics(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    analytics = []

    for p in products:
        sales_count = db.query(models.Sale).filter(models.Sale.product_id == p.id).count()
        total_seconds = p.total_inspection_seconds or 0
        minutes = round(total_seconds / 60, 1)
        
        if (p.view_count or 0) > 15 and sales_count == 0:
            advice = "⚠️ Yüksek İlgi / Düşük Satış: Fiyat veya işçilik müşteriye yüksek gelebilir, kampanya önerilir."
            status_tag = "YÜKSEK İLGİ"
        elif sales_count > 0:
            advice = "✅ Başarılı Ürün: Hızlı satışa dönüyor, vitrinde ön planda tutulmalı."
            status_tag = "SATILDI / POPÜLER"
        elif (p.view_count or 0) < 3:
            advice = "ℹ️ Düşük İlgi: Vitrinin daha aydınlık veya merkezi bir askısına/tablasına taşınabilir."
            status_tag = "DÜŞÜK İLGİ"
        else:
            advice = "🟡 Normal Seyir: Müşteri ilgisi dengeli."
            status_tag = "DENGELİ"

        analytics.append({
            "product_id": p.id,
            "product_name": p.name,
            "barcode": p.barcode,
            "category": p.category,
            "purity": p.purity,
            "weight_grams": p.weight_grams,
            "price": p.price,
            "view_count": p.view_count or 0,
            "inspection_minutes": minutes,
            "sales_count": sales_count,
            "current_status": p.status,
            "status_tag": status_tag,
            "advice": advice
        })

    analytics.sort(key=lambda x: (x["view_count"], x["sales_count"]), reverse=True)
    return analytics


@router.post("/slots/{slot_id}/authorize-inspection")
async def authorize_inspection(slot_id: int, req: schemas.SetAuthorizedInspectionRequest, db: Session = Depends(get_db)):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    slot.is_inspection_authorized = req.authorized
    db.commit()

    await iot_service.manager.broadcast({
        "type": "INSPECTION_AUTH_CHANGED",
        "slot_number": slot.slot_number,
        "is_inspection_authorized": slot.is_inspection_authorized
    })

    return {"message": f"Askı #{slot.slot_number} inceleme yetkisi: {req.authorized}"}


@router.post("/slots/{slot_id}/calibrate")
async def calibrate_slot(
    slot_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    slot.expected_weight = slot.current_weight
    slot.status = "NORMAL" if slot.current_weight > 0 else "EMPTY"
    
    log = models.SystemLog(
        level="INFO",
        module="IOT",
        message=f"Sensör daralandı/kalibre edildi: #{slot.slot_number} ({slot.label}) -> {slot.expected_weight}g",
        user_id=admin.id,
        user_name=admin.full_name
    )
    db.add(log)
    db.commit()

    await iot_service.manager.broadcast({
        "type": "SLOT_CALIBRATED",
        "slot_number": slot.slot_number,
        "expected_weight": slot.expected_weight,
        "current_weight": slot.current_weight
    })

    return {"message": "Cihaz kalibre edildi", "slot_number": slot.slot_number}


@router.get("/alerts", response_model=List[schemas.SecurityAlertOut])
def list_alerts(unresolved_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.SecurityAlert)
    if unresolved_only:
        query = query.filter(models.SecurityAlert.is_resolved == False)
    return query.order_by(models.SecurityAlert.id.desc()).limit(50).all()


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    resolved_by: str = Body("Personel", embed=True),
    current_user: Optional[models.User] = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(models.SecurityAlert).filter(models.SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı")

    resolver = current_user.full_name if current_user else resolved_by

    alert.is_resolved = True
    alert.resolved_by = resolver
    alert.resolved_at = datetime.datetime.utcnow()

    slot = alert.slot
    if slot and slot.status == "ALERT":
        slot.status = "NORMAL" if slot.expected_weight > 0 else "EMPTY"

    log = models.SystemLog(
        level="WARNING",
        module="SECURITY",
        message=f"Güvenlik alarmı çözüldü & susturuldu: {alert.message} (Çözen: {resolver})",
        user_id=current_user.id if current_user else None,
        user_name=resolver
    )
    db.add(log)
    db.commit()

    await iot_service.manager.broadcast({
        "type": "ALERT_RESOLVED",
        "alert_id": alert.id,
        "slot_id": slot.id if slot else None,
        "resolved_by": resolver
    })

    return {"message": "Alarm çözüldü ve susturuldu"}


# --- TEST VE SİMÜLASYON ENDPOINT'I ---
@router.post("/simulate")
async def simulate_iot_action(
    slot_number: int = Body(..., embed=True),
    action: str = Body(..., embed=True),
    delta_grams: Optional[float] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.slot_number == slot_number).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    if action == "LIFT_UNAUTHORIZED":
        slot.is_inspection_authorized = False
        db.commit()
        # Eğer özel eksilen gramaj belirtilmişse o kadar eksilt, yoksa ilk ürünün ağırlığını eksilt
        drop_weight = delta_grams
        if drop_weight is None:
            first_prod = slot.products[0] if slot.products else None
            drop_weight = first_prod.weight_grams if first_prod else 25.40
        new_w = max(0.0, slot.expected_weight - drop_weight)
        res = await iot_service.process_telemetry(db, slot_number=slot.slot_number, current_weight=new_w)
        return {"action": action, "weight_dropped": drop_weight, "result": res}

    elif action == "LIFT_AUTHORIZED":
        slot.is_inspection_authorized = True
        db.commit()
        new_w = max(0.0, slot.expected_weight - (delta_grams or 20.0))
        res = await iot_service.process_telemetry(db, slot_number=slot.slot_number, current_weight=new_w)
        return {"action": action, "result": res}

    elif action == "RETURN_PRODUCT":
        res = await iot_service.process_telemetry(db, slot_number=slot.slot_number, current_weight=slot.expected_weight)
        return {"action": action, "result": res}

    elif action == "TARE":
        res = await iot_service.process_telemetry(db, slot_number=slot.slot_number, current_weight=0.0)
        return {"action": action, "result": res}

    else:
        raise HTTPException(status_code=400, detail="Bilinmeyen simülasyon aksiyonu")
