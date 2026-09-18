import asyncio
import datetime
import json
import logging
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models
from .iot_service import manager

logger = logging.getLogger("iot_watchdog")

# Cihazdan son telemetri / ping geldikten sonra kaç saniye içinde çevrimdışı sayılacağı
OFFLINE_THRESHOLD_SECONDS = 15

async def check_iot_device_liveness():
    """
    Tüm aktif IoT yuvalarını tarar.
    Son iletişim zamanı eşik süresini aşan ve çevrimiçi görünen cihazları
    çevrimdışı (OFFLINE) işaretler ve anında alarm ile bildirim yayınlar.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.datetime.utcnow()
        # Sadece aktif (kullanımda olan) yuvaları denetle
        active_slots = db.query(models.RackSlot).filter(models.RackSlot.is_active == True).all()

        for slot in active_slots:
            # Son iletişim referansı: last_ping veya updated_at
            last_seen = slot.last_ping or slot.updated_at

            if not last_seen:
                # Henüz hiç sinyal alınmamışsa şimdilik atla
                continue

            delta_sec = (now - last_seen).total_seconds()

            # Eğer eşik aşıldıysa ve cihaz şu an çevrimiçi görünüyorsa -> KOPMA GERÇEKLEŞTİ
            if delta_sec > OFFLINE_THRESHOLD_SECONDS and slot.is_online:
                slot.is_online = False
                has_products = len(slot.products) > 0

                # 1. Kritik Sistem Logu Oluştur
                critical_msg = (
                    f"🚨 [IOT BAĞLANTISI KOPTU] #{slot.slot_number} numaralı '{slot.label}' "
                    f"IoT cihazının sunucu ile iletişimi kesildi! (IP: {slot.ip_address})"
                )
                sys_log = models.SystemLog(
                    level="CRITICAL",
                    module="IOT_SECURITY",
                    message=critical_msg,
                    user_name="IoT Watchdog Servisi",
                    details_json=json.dumps({
                        "event": "DEVICE_DISCONNECTED",
                        "slot_number": slot.slot_number,
                        "slot_id": slot.id,
                        "label": slot.label,
                        "ip_address": slot.ip_address,
                        "has_products": has_products,
                        "last_seen_seconds_ago": int(delta_sec)
                    })
                )
                db.add(sys_log)

                # 2. Eğer yuvada tanımlı ürün varsa -> GÜVENLİK ALARMI OLUŞTUR (Sabotaj / Hırsızlık Şüphesi)
                if has_products:
                    product_names = ", ".join([p.name for p in slot.products[:2]])
                    sec_alert = models.SecurityAlert(
                        slot_id=slot.id,
                        alert_type="DEVICE_DISCONNECTED",
                        message=(
                            f"ACİL DONANIM ALARMI: #{slot.slot_number} numaralı askı cihazının bağlantısı koptu! "
                            f"Askıdaki ürünler: {product_names}. Sabotaj, kablo kesilmesi veya elektrik kesintisi ihtimali!"
                        ),
                        weight_lost=slot.expected_weight,
                        is_resolved=False
                    )
                    db.add(sec_alert)

                db.commit()
                db.refresh(slot)

                # 3. Canlı WebSocket Yayını ile Tüm Ekranlara Bildir
                await manager.broadcast({
                    "type": "DEVICE_OFFLINE",
                    "slot_number": slot.slot_number,
                    "slot_id": slot.id,
                    "label": slot.label,
                    "ip_address": slot.ip_address,
                    "has_products": has_products,
                    "message": critical_msg,
                    "timestamp": now.isoformat()
                })

                logger.warning(f"Watchdog: Slot #{slot.slot_number} ({slot.ip_address}) OFFLINE olarak işaretlendi ve alarm verildi.")

    except Exception as e:
        logger.error(f"IoT Watchdog tarama hatası: {e}")
        db.rollback()
    finally:
        db.close()


async def run_iot_watchdog():
    """
    Arka planda sürekli çalışan IoT Watchdog görevi.
    Her 4 saniyede bir cihaz canlılığını kontrol eder.
    """
    logger.info("IoT Watchdog & Liveness Monitoring servisi başlatıldı.")
    while True:
        try:
            await check_iot_device_liveness()
        except Exception as e:
            logger.error(f"IoT Watchdog döngü hatası: {e}")
        await asyncio.sleep(4)
