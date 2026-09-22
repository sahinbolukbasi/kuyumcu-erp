import datetime
import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket
from sqlalchemy.orm import Session
from . import models

logger = logging.getLogger("iot_service")

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, tenant_id: int, session_id: str):
        await websocket.accept()
        self.active_connections[websocket] = (tenant_id, session_id)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.pop(websocket, None)

    async def broadcast(self, message: Dict[str, Any]):
        tenant_id = message.get('tenant_id')
        if tenant_id is None:
            return
        text_data = json.dumps(message, default=str)
        dead_connections = []
        for connection, (owner_id, session_id) in list(self.active_connections.items()):
            if owner_id != tenant_id:
                continue
            try:
                from .database import SessionLocal
                from .auth import ensure_tenant_access
                with SessionLocal() as db:
                    session = db.get(models.AuthSession, session_id)
                    user = db.get(models.User, session.user_id) if session else None
                    if not session or session.revoked or session.expires_at <= datetime.datetime.utcnow() or not user or not user.is_active:
                        await connection.close(code=4401)
                        dead_connections.append(connection)
                        continue
                    ensure_tenant_access(db, user)
                await connection.send_text(text_data)
            except Exception:
                dead_connections.append(connection)
        for dc in dead_connections:
            self.disconnect(dc)

manager = ConnectionManager()


async def process_telemetry(db: Session, slot_number: int, current_weight: float, device_id: str = "DEVICE_01"):
    """
    IoT sensöründen gelen ağırlığı işler, alarm ve inceleme kontrollerini yapar.
    """
    slot = db.query(models.RackSlot).filter(models.RackSlot.slot_number == slot_number).first()
    if not slot:
        from fastapi import HTTPException
        raise HTTPException(404, 'Cihaz / askı önceden firmaya tanımlanmalıdır.')

    now = datetime.datetime.utcnow()
    was_offline = (slot.is_online is False)
    slot.last_ping = now
    slot.is_online = True
    slot.updated_at = now

    old_weight = slot.current_weight
    slot.current_weight = round(current_weight, 2)

    # Eğer cihaz daha önce kopmuş ve şimdi tekrar bağlandıysa bildirim & log üret
    if was_offline and slot.is_active:
        reconnect_msg = f"🟢 [IOT BAĞLANTI YENİLENDİ] #{slot.slot_number} numaralı '{slot.label}' IoT cihazı sunucuya tekrar bağlandı."
        sys_log = models.SystemLog(
            level="INFO",
            module="IOT_SYSTEM",
            message=reconnect_msg,
            user_name="IoT Servisi",
            details_json=json.dumps({
                "event": "DEVICE_RECONNECTED",
                "slot_number": slot.slot_number,
                "slot_id": slot.id,
                "label": slot.label,
                "ip_address": slot.ip_address
            })
        )
        db.add(sys_log)
        # Arka planda WebSocket ile istemcilere bildir
        try:
            await manager.broadcast({"tenant_id": slot.tenant_id,
                "type": "DEVICE_ONLINE",
                "slot_number": slot.slot_number,
                "slot_id": slot.id,
                "label": slot.label,
                "ip_address": slot.ip_address,
                "message": reconnect_msg,
                "timestamp": now.isoformat()
            })
        except Exception:
            pass

    # Eğer cihaz devre dışı (pasif) bırakılmışsa alarm üretme
    if slot.is_active is False or slot.status == "DISABLED":
        db.commit()
        return {
            "type": "DISABLED_SLOT",
            "slot_number": slot.slot_number,
            "slot_id": slot.id,
            "status": "DISABLED",
            "message": "Cihaz devre dışı (pasif) durumdadır."
        }

    event_type = "WEIGHT_UPDATE"
    alert_triggered = False
    alert_info = None

    product = slot.products[0] if slot.products else None

    # Eğer askıda tanımlı bir ürün varsa:
    if product and slot.expected_weight > 0:
        diff = slot.expected_weight - slot.current_weight
        tolerance = slot.tolerance_grams

        # Durum 1: Ürün askıda tam duruyor (Fark tolerans içinde)
        if abs(diff) <= tolerance:
            # Eğer önceden incelemede veya alarmdaysa, ürün yerine kondu!
            if slot.status in ["INSPECTION", "ALERT"]:
                event_type = "PRODUCT_RETURNED"
                # Açık inceleme logunu kapat
                latest_insp = db.query(models.InspectionLog).filter(
                    models.InspectionLog.product_id == product.id,
                    models.InspectionLog.returned_at.is_(None)
                ).order_by(models.InspectionLog.id.desc()).first()

                if latest_insp:
                    now = datetime.datetime.utcnow()
                    latest_insp.returned_at = now
                    delta = (now - latest_insp.lifted_at).total_seconds()
                    latest_insp.duration_seconds = max(1, int(delta))
                    product.total_inspection_seconds += latest_insp.duration_seconds

            slot.status = "NORMAL"
            slot.is_inspection_authorized = False

        # Durum 2: Ağırlık belirgin şekilde eksildi (Ürün kaldırıldı veya eksildi)
        elif diff > tolerance:
            # Ürün askıdan kaldırılmış
            if slot.is_inspection_authorized:
                # Yetkili inceleme modu
                if slot.status != "INSPECTION":
                    slot.status = "INSPECTION"
                    slot.last_lifted_at = datetime.datetime.utcnow()
                    product.view_count += 1
                    event_type = "INSPECTION_STARTED"
                    # Log oluştur
                    insp_log = models.InspectionLog(
                        product_id=product.id,
                        slot_id=slot.id,
                        lifted_at=datetime.datetime.utcnow(),
                        was_authorized=True
                    )
                    db.add(insp_log)
            else:
                # İZİNSİZ EKSİLME -> KRİTİK ALARM!
                if slot.status != "ALERT":
                    slot.status = "ALERT"
                    slot.last_lifted_at = datetime.datetime.utcnow()
                    product.view_count += 1
                    event_type = "SECURITY_ALERT"
                    alert_triggered = True

                    # Güvenlik alarm kaydı oluştur
                    alert = models.SecurityAlert(
                        slot_id=slot.id,
                        product_id=product.id,
                        alert_type="UNAUTHORIZED_LIFT",
                        message=f"DİKKAT: Askı #{slot.slot_number} üzerindeki {product.name} ({product.weight_grams}g) İZİNSİZ KALDIRILDI!",
                        weight_lost=round(diff, 2),
                        is_resolved=False
                    )
                    db.add(alert)
                    db.flush()

                    alert_info = {
                        "alert_id": alert.id,
                        "slot_id": slot.id,
                        "slot_number": slot.slot_number,
                        "product_id": product.id,
                        "product_name": product.name,
                        "expected_weight": slot.expected_weight,
                        "current_weight": slot.current_weight,
                        "weight_lost": round(diff, 2),
                        "message": alert.message,
                        "time": alert.created_at.strftime("%H:%M:%S")
                    }

                    # İzinsiz inceleme logu
                    insp_log = models.InspectionLog(
                        product_id=product.id,
                        slot_id=slot.id,
                        lifted_at=datetime.datetime.utcnow(),
                        was_authorized=False
                    )
                    db.add(insp_log)
    else:
        # Ürün bağlı değilse
        if slot.current_weight <= 0.05:
            slot.status = "EMPTY"
        else:
            slot.status = "NORMAL"

    db.commit()
    db.refresh(slot)

    # Canlı WebSocket yayını
    broadcast_data = {
        "type": event_type,
        "slot_number": slot.slot_number,
        "slot_id": slot.id,
        "status": slot.status,
        "current_weight": slot.current_weight,
        "expected_weight": slot.expected_weight,
        "is_inspection_authorized": slot.is_inspection_authorized,
        "product": {
            "id": product.id,
            "name": product.name,
            "barcode": product.barcode,
            "category": product.category,
            "weight_grams": product.weight_grams,
            "price": product.price,
            "image_url": product.image_url,
            "view_count": product.view_count
        } if product else None,
        "alert": alert_info,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

    await manager.broadcast({**broadcast_data, "tenant_id": slot.tenant_id})
    return broadcast_data
