import os
import shutil
import zipfile
import datetime
import hashlib
import threading
import time
from sqlalchemy.orm import Session
from .database import SessionLocal, DATABASE_URL
from . import models

BACKUP_DIR = os.path.join(os.getcwd(), "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

def calculate_checksum(file_path):
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

def perform_backup(tenant_id=None, backup_type="ON_DEMAND", notes=None):
    """
    Veritabanını ve gerekli sistem verilerini sıkıştırılmış ZIP arşivi olarak yedekler.
    Veritabanı kayıt defterine (TenantBackupLog) işler.
    """
    now = datetime.datetime.utcnow()
    timestamp_str = now.strftime("%Y%m%d_%H%M%S")
    backup_filename = f"GG_BACKUP_{timestamp_str}.zip"
    backup_filepath = os.path.join(BACKUP_DIR, backup_filename)

    db = SessionLocal()
    try:
        # Yedeklenecek dosyaları tespit et
        files_to_backup = []
        
        # 1. SQLite veritabanı dosyası
        db_path = "kuyumculuk.db"
        if DATABASE_URL.startswith("sqlite:///"):
            raw_path = DATABASE_URL.replace("sqlite:///", "")
            if os.path.exists(raw_path):
                db_path = raw_path
        
        if os.path.exists(db_path):
            files_to_backup.append((db_path, "kuyumculuk.db"))
        
        # Docker /app/data altındaki db varsa onu da kontrol et
        if os.path.exists("/app/data/kuyumculuk.db"):
            files_to_backup.append(("/app/data/kuyumculuk.db", "database/kuyumculuk.db"))

        # ZIP Arşivini oluştur
        with zipfile.ZipFile(backup_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for file_path, arcname in files_to_backup:
                if os.path.exists(file_path):
                    zipf.write(file_path, arcname=arcname)
            
            # Yedek meta bilgisi
            meta_content = f"""GOLDEN GUARD ERP - GÜVENLİ VERİTABANI YEDEK DOSYASI
Yedek Tarihi (UTC): {now.isoformat()}
Yedek Türü: {backup_type}
Firma ID: {tenant_id or 'TÜM ŞİRKETLER KONSOLİDE'}
Versiyon: 2.4.0 Multi-Tenant
"""
            zipf.writestr("BACKUP_METADATA.txt", meta_content)

        file_size_bytes = os.path.getsize(backup_filepath)
        file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
        checksum = calculate_checksum(backup_filepath)

        # Veritabanına yedek kaydı ekle
        backup_record = models.TenantBackupLog(
            tenant_id=tenant_id,
            backup_type=backup_type,
            file_name=backup_filename,
            file_size_bytes=file_size_bytes,
            file_size_mb=file_size_mb,
            file_path=backup_filepath,
            checksum=checksum,
            status="COMPLETED",
            notes=notes or f"{backup_type} yedekleme başarıyla tamamlandı.",
            created_at=now
        )
        db.add(backup_record)

        # Sistem günlüğüne de işle
        log_entry = models.SystemLog(
            level="INFO",
            module="BACKUP_SERVICE",
            message=f"Veritabanı güvenli yedeği alındı: {backup_filename} ({file_size_mb} MB) [Checksum: {checksum[:8]}...]"
        )
        db.add(log_entry)
        db.commit()
        db.refresh(backup_record)

        return backup_record

    except Exception as e:
        print(f"[BackupService Error] {e}")
        try:
            failed_record = models.TenantBackupLog(
                tenant_id=tenant_id,
                backup_type=backup_type,
                file_name=backup_filename,
                file_size_bytes=0,
                file_size_mb=0.0,
                file_path=backup_filepath,
                status="FAILED",
                notes=f"Hata: {str(e)}",
                created_at=now
            )
            db.add(failed_record)
            db.commit()
        except:
            pass
        return None
    finally:
        db.close()


def run_nightly_backup_scheduler():
    """
    Her gece saat 03:00'te otomatik veritabanı yedeği alan arka plan bekçisi.
    """
    def scheduler_loop():
        while True:
            try:
                now = datetime.datetime.now()
                # Gece 03:00 kontrolü (03:00 - 03:05 arası günde 1 kez)
                if now.hour == 3 and now.minute <= 5:
                    print("[BackupScheduler] Gece 03:00 otomatik yedekleme başlatılıyor...")
                    perform_backup(
                        tenant_id=None,
                        backup_type="NIGHTLY_AUTOMATIC",
                        notes="Otomatik Gece 03:00 Güvenlik Snapshot Yedeği"
                    )
                    # 10 dakika uyu ki aynı saat diliminde tekrar tetiklenmesin
                    time.sleep(600)
                else:
                    # 60 saniyede bir kontrol et
                    time.sleep(60)
            except Exception as e:
                print(f"[BackupScheduler Loop Error] {e}")
                time.sleep(60)

    t = threading.Thread(target=scheduler_loop, daemon=True)
    t.start()
    print("[BackupScheduler] Gece yedekleme zamanlayıcısı arka planda aktif edildi.")
