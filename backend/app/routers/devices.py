# ==============================================================================
# 💎 Golden Guard IoT ERP - IoT Cihaz Yönetimi & Ürün Atama Router'ı
# ==============================================================================
# Bu modül:
# 1. IoT cihaz kaydı (Pico W / ESP32 / ESP8266)
# 2. Cihaz eşleştirme (auth_token üretimi)
# 3. Cihaza ürün atama (hangi slotta hangi ürün)
# 4. Cihazdan telemetri alma (sürekli veri akışı)
# 5. Cihaz istatistikleri (Admin Dashboard)
# ==============================================================================

import datetime
import json
import uuid
import random
import string
from typing import List, Optional
from fastapi import Request, APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from .. import models, schemas, auth, iot_service

router = APIRouter(prefix="/api/v1/devices", tags=["IoT Cihaz Yönetimi & Ürün Atama"])


def generate_auth_token() -> str:
    """Cihaz eşleştirme için benzersiz token üretir"""
    return f"GG-IOT-{uuid.uuid4().hex[:16].upper()}"


# =========================================================================
# 1. CİHAZ CRUD
# =========================================================================

@router.post("", response_model=schemas.IoTDeviceOut)
def create_device(
    device_in: schemas.IoTDeviceCreate,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Yeni IoT cihazı kaydeder"""
    existing = db.query(models.IoTDevice).filter(
        (models.IoTDevice.device_id == device_in.device_id) |
        (models.IoTDevice.mac_address == device_in.mac_address)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu device_id veya MAC adresi zaten kayıtlı.")

    device = models.IoTDevice(
        device_id=device_in.device_id,
        device_type=device_in.device_type,
        mac_address=device_in.mac_address,
        firmware_version=device_in.firmware_version,
        label=device_in.label,
        branch_id=device_in.branch_id,
        location_desc=device_in.location_desc,
        ip_address=device_in.ip_address,
        port=device_in.port,
        wifi_ssid=device_in.wifi_ssid,
        tenant_id=admin.tenant_id,
        is_online=False,
        is_active=True,
        status="INACTIVE"
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    # Log
    log = models.SystemLog(
        level="INFO",
        module="IOT_SYSTEM",
        message=f"📡 Yeni IoT cihazı kaydedildi: {device.device_id} ({device.label})",
        user_id=admin.id,
        user_name=admin.full_name,
        details_json=json.dumps({"device_id": device.device_id, "type": device.device_type})
    )
    db.add(log)
    db.commit()

    return device


@router.get("", response_model=List[schemas.IoTDeviceOut])
def list_devices(
    branch_id: Optional[int] = None,
    status: Optional[str] = None,
    device_type: Optional[str] = None,
    is_online: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Tüm IoT cihazlarını listeler"""
    query = db.query(models.IoTDevice)

    if branch_id and branch_id > 0:
        query = query.filter(models.IoTDevice.branch_id == branch_id)
    if status:
        query = query.filter(models.IoTDevice.status == status)
    if device_type:
        query = query.filter(models.IoTDevice.device_type == device_type)
    if is_online is not None:
        query = query.filter(models.IoTDevice.is_online == is_online)
    if search:
        sf = f"%{search}%"
        query = query.filter(
            (models.IoTDevice.device_id.ilike(sf)) |
            (models.IoTDevice.label.ilike(sf)) |
            (models.IoTDevice.mac_address.ilike(sf))
        )

    devices = query.order_by(models.IoTDevice.created_at.desc()).all()

    # Slot sayısını ve branch adını ekle
    result = []
    for d in devices:
        slot_count = len(d.slots) if d.slots else 0
        branch_name = d.branch.name if d.branch else ""
        result.append({
            **{c.name: getattr(d, c.name) for c in models.IoTDevice.__table__.columns},
            "slot_count": slot_count,
            "branch_name": branch_name
        })

    return result


@router.get("/{device_id}", response_model=schemas.IoTDeviceOut)
def get_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Cihaz detayını getirir"""
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    slot_count = len(device.slots) if device.slots else 0
    branch_name = device.branch.name if device.branch else ""

    result = {c.name: getattr(device, c.name) for c in models.IoTDevice.__table__.columns}
    result["slot_count"] = slot_count
    result["branch_name"] = branch_name
    return result


@router.put("/{device_id}", response_model=schemas.IoTDeviceOut)
def update_device(
    device_id: int,
    device_in: schemas.IoTDeviceUpdate,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Cihaz bilgilerini günceller"""
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    update_dict = device_in.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(device, key, value)

    db.commit()
    db.refresh(device)

    slot_count = len(device.slots) if device.slots else 0
    branch_name = device.branch.name if device.branch else ""
    result = {c.name: getattr(device, c.name) for c in models.IoTDevice.__table__.columns}
    result["slot_count"] = slot_count
    result["branch_name"] = branch_name
    return result


@router.delete("/{device_id}", response_model=dict)
def delete_device(
    device_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Cihazı siler (önce slot bağlantılarını temizler)"""
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    device_id_str = device.device_id

    # Bağlı slotları temizle
    for slot in device.slots:
        slot.iot_device_id = None

    db.query(models.DeviceCredential).filter(models.DeviceCredential.device_id == device_id).delete()
    db.delete(device)
    db.commit()

    return {"success": True, "message": f"{device_id_str} cihazı silindi."}


# =========================================================================
# 2. CİHAZ EŞLEŞTİRME (Pairing)
# =========================================================================

@router.post("/{device_id}/pair", response_model=schemas.IoTDevicePairResponse)
def pair_device(
    device_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Cihazı eşleştirir (auth_token üretir, cihazı ACTIVE yapar)"""
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    if device.status == "ACTIVE":
        raise HTTPException(status_code=400, detail="Cihaz zaten eşleştirilmiş durumda.")

    auth_token = rotate_device_credential(device_id, admin, db)['device_key']
    now = datetime.datetime.utcnow()

    device.auth_token = None
    device.paired_at = now
    device.paired_by = admin.full_name
    device.status = "ACTIVE"
    device.is_active = True

    db.commit()
    db.refresh(device)

    log = models.SystemLog(
        level="INFO",
        module="IOT_SYSTEM",
        message=f"🔗 IoT cihaz eşleştirildi: {device.device_id} ({device.label}) -> {admin.full_name}",
        user_id=admin.id,
        user_name=admin.full_name,
        details_json=json.dumps({"device_id": device.device_id, "credential_rotated": True})
    )
    db.add(log)
    db.commit()

    return schemas.IoTDevicePairResponse(
        success=True,
        message=f"Cihaz başarıyla eşleştirildi.",
        device_id=device.device_id,
        auth_token=auth_token,
        paired_at=now.isoformat()
    )


@router.post("/{device_id}/unpair", response_model=dict)
def unpair_device(
    device_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Cihaz eşleştirmesini kaldırır"""
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    device.auth_token = None
    device.paired_at = None
    device.paired_by = None
    db.query(models.DeviceCredential).filter(models.DeviceCredential.device_id == device_id).update({"revoked": True})
    device.status = "INACTIVE"
    device.is_online = False

    db.commit()

    return {"success": True, "message": f"{device.device_id} eşleştirmesi kaldırıldı."}


# =========================================================================
# 3. CİHAZA ÜRÜN ATAMA
# =========================================================================

@router.post("/{device_id}/assign-product", response_model=dict)
def assign_product_to_device(
    device_id: int,
    assign_in: schemas.IoTDeviceAssignProduct,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Cihaza ürün atar (hangi slotta hangi ürün olacağını belirler)"""
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    product = db.query(models.Product).filter(models.Product.id == assign_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    slot = db.query(models.RackSlot).filter(models.RackSlot.id == assign_in.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot/Askı bulunamadı")

    # Slot'u cihaza bağla
    slot.iot_device_id = device.id
    slot.device_id = device.device_id

    # Ürünü slot'a ata
    product.slot_id = slot.id
    product.status = "Vitrinde"
    product.branch_id = device.branch_id

    # Slot ağırlığını güncelle
    qty = assign_in.quantity or 1
    total_weight = round(product.weight_grams * qty, 2)
    slot.expected_weight = total_weight
    slot.current_weight = total_weight
    slot.status = "NORMAL"

    db.commit()

    log = models.SystemLog(
        level="INFO",
        module="IOT_SYSTEM",
        message=f"📦 Ürün cihaza atandı: {product.name} -> {device.label} (Slot #{slot.slot_number})",
        user_id=admin.id,
        user_name=admin.full_name,
        details_json=json.dumps({
            "device_id": device.device_id,
            "product_id": product.id,
            "slot_id": slot.id,
            "weight": total_weight
        })
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": f"{product.name} ürünü {device.label} cihazına (Slot #{slot.slot_number}) atandı.",
        "device_id": device.device_id,
        "product_id": product.id,
        "slot_id": slot.id,
        "expected_weight": total_weight
    }


@router.delete("/{device_id}/remove-product/{product_id}", response_model=dict)
def remove_product_from_device(
    device_id: int,
    product_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Cihazdan ürün çıkarır"""
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    slot = product.slot
    if slot:
        slot.expected_weight = max(0, slot.expected_weight - product.weight_grams)
        slot.current_weight = max(0, slot.current_weight - product.weight_grams)
        if slot.expected_weight <= 0:
            slot.status = "EMPTY"

    product.slot_id = None
    product.status = "Kasada"

    db.commit()

    return {"success": True, "message": f"{product.name} cihazdan çıkarıldı."}


@router.get("/{device_id}/products", response_model=List[dict])
def get_device_products(
    device_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Cihaza bağlı tüm ürünleri listeler"""
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    products = []
    for slot in device.slots:
        for p in slot.products:
            products.append({
                "product_id": p.id,
                "product_name": p.name,
                "barcode": p.barcode,
                "category": p.category,
                "purity": p.purity,
                "weight_grams": p.weight_grams,
                "price": p.price,
                "image_url": p.image_url,
                "slot_id": slot.id,
                "slot_number": slot.slot_number,
                "slot_label": slot.label,
                "slot_type": slot.slot_type,
                "status": p.status
            })

    return products


# =========================================================================
# 4. CİHAZDAN TELEMETRİ ALMA (Sürekli Veri Akışı)
# =========================================================================

@router.post("/telemetry", response_model=dict)
async def receive_device_telemetry(
    request: Request,
    telemetry: schemas.IoTDeviceTelemetry,
    db: Session = Depends(get_db),
    _=Depends(auth.require_iot_access)
):
    """
    IoT cihazından sürekli telemetri alır.
    Cihaz bu endpoint'e 5 saniyede bir heartbeat + ağırlık verisi gönderir.
    """
    expected = getattr(request.state, 'device_id', None)
    if expected and telemetry.device_id != expected:
        raise HTTPException(403, 'Cihaz anahtarı bu cihaza ait değil.')
    # Cihazı device_id ile bul
    device = db.query(models.IoTDevice).filter(
        models.IoTDevice.device_id == telemetry.device_id,
        models.IoTDevice.is_active == True
    ).first()

    if not device:
        raise HTTPException(404, 'Cihaz önce yönetici tarafından tanımlanmalıdır.')

    now = datetime.datetime.utcnow()
    was_offline = not device.is_online

    # Cihaz durumunu güncelle
    device.is_online = True
    device.last_ping = now
    device.total_heartbeats = (device.total_heartbeats or 0) + 1
    if telemetry.battery_level:
        device.battery_level = telemetry.battery_level
    if telemetry.wifi_rssi:
        device.wifi_rssi = telemetry.wifi_rssi

    # Slot'u bul ve ağırlığı güncelle
    slot = db.query(models.RackSlot).filter(
        models.RackSlot.slot_number == telemetry.slot_number,
        models.RackSlot.iot_device_id == device.id
    ).first()

    if not slot:
        # Otomatik slot oluştur
        max_slot = db.query(models.RackSlot).order_by(models.RackSlot.slot_number.desc()).first()
        next_num = (max_slot.slot_number + 1) if max_slot else telemetry.slot_number
        slot = models.RackSlot(
            slot_number=next_num,
            label=f"Askı #{next_num}",
            device_id=device.device_id,
            iot_device_id=device.id,
            ip_address=device.ip_address,
            branch_id=device.branch_id,
            is_online=True,
            status="EMPTY"
        )
        db.add(slot)
        db.flush()

    # Ağırlık değişimini kontrol et
    old_weight = slot.current_weight
    slot.current_weight = round(telemetry.weight_grams, 2)
    slot.last_ping = now
    slot.is_online = True
    slot.updated_at = now

    weight_diff = round(abs(old_weight - telemetry.weight_grams), 2)

    # Eğer cihaz yeniden bağlandıysa bildirim
    if was_offline:
        await iot_service.manager.broadcast({"tenant_id": db.info.get("tenant_id"),
            "type": "DEVICE_ONLINE",
            "device_id": device.device_id,
            "slot_number": slot.slot_number,
            "label": device.label,
            "message": f"🟢 Cihaz tekrar çevrimiçi: {device.label}",
            "timestamp": now.isoformat()
        })

    # Ağırlık sapması varsa alarm kontrolü
    if weight_diff > (slot.tolerance_grams or 0.20) and slot.expected_weight > 0:
        slot.status = "ALERT"
        device.total_alarms = (device.total_alarms or 0) + 1
        device.last_alarm_at = now

        # SecurityAlert oluştur
        alert = models.SecurityAlert(
            slot_id=slot.id,
            alert_type="WEIGHT_ANOMALY",
            message=f"⚡ Ağırlık sapması: {device.label} (Slot #{slot.slot_number}) - Beklenen: {slot.expected_weight}g, Ölçülen: {telemetry.weight_grams}g, Fark: {weight_diff}g",
            weight_lost=weight_diff,
            is_resolved=False
        )
        db.add(alert)

        # WebSocket bildirimi
        await iot_service.manager.broadcast({"tenant_id": db.info.get("tenant_id"),
            "type": "WEIGHT_ALERT",
            "device_id": device.device_id,
            "slot_number": slot.slot_number,
            "expected_weight": slot.expected_weight,
            "current_weight": telemetry.weight_grams,
            "weight_diff": weight_diff,
            "message": f"🚨 Ağırlık alarmı: {device.label}",
            "timestamp": now.isoformat()
        })

    db.commit()

    return {
        "status": "ok",
        "device_id": device.device_id,
        "slot_number": slot.slot_number,
        "weight": telemetry.weight_grams,
        "is_online": True,
        "timestamp": now.isoformat()
    }


# =========================================================================
# 5. CİHAZ İSTATİSTİKLERİ (Admin Dashboard)
# =========================================================================

@router.get("/analytics/stats", response_model=schemas.IoTDeviceStatsOut)
def get_device_stats(
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Tüm cihaz istatistiklerini döndürür"""
    total = db.query(models.IoTDevice).count()
    online = db.query(models.IoTDevice).filter(models.IoTDevice.is_online == True).count()
    offline = db.query(models.IoTDevice).filter(models.IoTDevice.is_online == False, models.IoTDevice.is_active == True).count()
    active_alerts = db.query(models.SecurityAlert).filter(models.SecurityAlert.is_resolved == False).count()

    # Cihaza atanmış toplam ürün
    total_products = db.query(models.Product).filter(
        models.Product.slot_id.isnot(None),
        models.Product.status == "Vitrinde"
    ).count()

    # Tipe göre dağılım
    by_type = db.query(
        models.IoTDevice.device_type,
        models.IoTDevice.is_online
    ).all()
    type_counts = {}
    for t, online_flag in by_type:
        key = t or "UNKNOWN"
        if key not in type_counts:
            type_counts[key] = {"total": 0, "online": 0}
        type_counts[key]["total"] += 1
        if online_flag:
            type_counts[key]["online"] += 1

    # Şubeye göre dağılım
    by_branch = db.query(
        models.Branch.name,
        models.IoTDevice.branch_id
    ).join(models.IoTDevice, models.Branch.id == models.IoTDevice.branch_id).all()
    branch_counts = {}
    for name, bid in by_branch:
        if name not in branch_counts:
            branch_counts[name] = 0
        branch_counts[name] += 1

    return schemas.IoTDeviceStatsOut(
        total_devices=total,
        online_devices=online,
        offline_devices=offline,
        active_alerts=active_alerts,
        total_products_assigned=total_products,
        devices_by_type=[{"type": k, "total": v["total"], "online": v["online"]} for k, v in type_counts.items()],
        devices_by_branch=[{"branch": k, "count": v} for k, v in branch_counts.items()],
        recent_telemetry=[]
    )

@router.post('/{device_id}/credential')
def rotate_device_credential(device_id: int, admin=Depends(auth.require_admin), db: Session = Depends(get_db)):
    import secrets
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(404, 'Cihaz bulunamadı.')
    db.query(models.DeviceCredential).filter(models.DeviceCredential.device_id == device_id).update({'revoked': True})
    key = secrets.token_urlsafe(48)
    db.add(models.DeviceCredential(id=auth.session_digest(key),tenant_id=admin.tenant_id,device_id=device_id))
    db.add(models.SystemLog(module='SECURITY',level='INFO',message=f'Cihaz anahtarı yenilendi: {device_id}',user_id=admin.id,user_name=admin.full_name))
    db.commit()
    return {'device_key':key,'device_id':device.device_id,'message':'Anahtar yalnızca bu yanıtta gösterilir. Cihazda X-Device-Key başlığı ile gönderiniz.'}


# =========================================================================
# 6. 6 HANELİ KOD İLE CİHAZ EŞLEŞTİRME
# =========================================================================

@router.post("/{device_id}/generate-pair-code", response_model=dict)
def generate_pair_code(
    device_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Cihaz için 6 haneli eşleştirme kodu üretir"""
    device = db.query(models.IoTDevice).filter(models.IoTDevice.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")
    code = ''.join(random.choices(string.digits, k=6))
    device.pair_code = code
    db.commit()
    return {"pair_code": code, "device_id": device.device_id, "message": "Kodu Pico cihazın config.py dosyasındaki PAIR_CODE değerine yazın."}


@router.post("/register-by-code", response_model=dict)
def register_device_by_code(
    payload: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Pico cihazı 6 haneli kod ile ERP'ye kaydeder"""
    code = payload.get("pair_code", "")
    device_id = payload.get("device_id", "")
    ip_address = payload.get("ip_address", "")
    firmware_version = payload.get("firmware_version", "")
    wifi_rssi = payload.get("wifi_rssi", -60)

    if not code or len(code) != 6:
        raise HTTPException(status_code=400, detail="Geçerli 6 haneli kod gerekli.")

    device = db.query(models.IoTDevice).filter(
        models.IoTDevice.pair_code == code
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Bu kodla eşleşen cihaz bulunamadı. Önce ERP'den kod oluşturun.")

    now = datetime.datetime.utcnow()
    device.device_id = device_id or device.device_id
    device.ip_address = ip_address or device.ip_address
    device.firmware_version = firmware_version or device.firmware_version
    device.wifi_rssi = wifi_rssi
    device.is_online = True
    device.is_active = True
    device.status = "ACTIVE"
    device.last_ping = now
    device.pair_code = None  # Kodu tek kullanımlık yap

    db.commit()

    return {
        "status": "ok",
        "device_id": device.device_id,
        "label": device.label,
        "message": f"Cihaz başarıyla kaydedildi ve aktif edildi."
    }
