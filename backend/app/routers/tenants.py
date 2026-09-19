import os
import random
import string
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth, backup_service

router = APIRouter(prefix="/api/v1/saas", tags=["Master SaaS & Lisans Yönetimi"])

def generate_license_key():
    """GG-LIC-2026-XXXX-YYYY formatında lisans anahtarı üretir"""
    year = datetime.datetime.utcnow().year
    part1 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    part2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"GG-LIC-{year}-{part1}-{part2}"

@router.post("/tenants", response_model=schemas.TenantCompanyOut)
def create_tenant_company(
    data: schemas.TenantCompanyCreate,
    current_user: Optional[models.User] = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Yeni Müşteri Firma Kurulumu, Lisans Atama ve İlk Admin Hesabını Açma.
    """
    # 1. Firma Kodunu Belirle (örn: GG-TEN-101)
    count = db.query(models.TenantCompany).count() + 101
    company_code = f"GG-TEN-{count}"

    # 2. Firma Kaydı
    tenant = models.TenantCompany(
        company_code=company_code,
        company_name=data.company_name.strip(),
        owner_name=data.owner_name.strip(),
        contact_phone=data.contact_phone.strip(),
        contact_email=data.contact_email.strip(),
        city=data.city.strip() if data.city else "İstanbul",
        tax_id=data.tax_id.strip() if data.tax_id else None,
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(tenant)
    db.flush()

    # 3. Lisans Süresi & Anahtar
    now = datetime.datetime.utcnow()
    duration_months = data.duration_months or (12 if data.plan_type == "YEARLY" else 1)
    end_date = now + datetime.timedelta(days=duration_months * 30)

    license_key = generate_license_key()
    license_obj = models.TenantLicense(
        tenant_id=tenant.id,
        license_key=license_key,
        plan_type=data.plan_type or "YEARLY",
        billing_cycle=data.billing_cycle or "YEARLY",
        subscription_fee=data.subscription_fee or 48000.0,
        currency=data.currency or "TRY",
        status="ACTIVE",
        start_date=now,
        end_date=end_date,
        auto_renew=True,
        max_admin_count=data.max_admin_count or 2,
        max_staff_count=data.max_staff_count or 5,
        max_branches_count=data.max_branches_count or 2,
        max_showcase_slots=data.max_showcase_slots or 100,
        storage_limit_mb=5000,
        created_at=now
    )
    db.add(license_obj)

    # 4. İlk Müşteri Admin Hesabını Aç
    # Kullanıcı adı çakışmasını önle
    base_user = data.admin_username.strip().lower()
    existing_user = db.query(models.User).filter(models.User.username == base_user).first()
    final_username = base_user
    if existing_user:
        final_username = f"{base_user}_{tenant.id}"

    first_admin = models.User(
        username=final_username,
        password_hash=auth.hash_password(data.admin_password),
        full_name=data.admin_full_name.strip(),
        role="ADMIN",
        branch_id=1,
        tenant_id=tenant.id,
        is_active=True,
        created_at=now
    )
    db.add(first_admin)

    # 5. Kullanım Metrikleri Başlangıcı
    sub_monthly = (data.subscription_fee / 12.0) if (data.plan_type == "YEARLY") else (data.subscription_fee or 4000.0)
    server_cost_usd = 4.50
    server_cost_try = server_cost_usd * 41.50 # Ortalama kur
    net_profit = max(0.0, sub_monthly - server_cost_try)
    margin = (net_profit / sub_monthly * 100.0) if sub_monthly > 0 else 90.0

    metric = models.TenantUsageMetric(
        tenant_id=tenant.id,
        active_online_users=1,
        daily_api_requests=10,
        total_db_records=5,
        storage_used_mb=12.5,
        estimated_server_cost_usd=server_cost_usd,
        estimated_server_cost_try=round(server_cost_try, 2),
        net_saas_profit_try=round(net_profit, 2),
        profit_margin_percent=round(margin, 1),
        last_ping_at=now
    )
    db.add(metric)

    # 6. Sistem Günlüğüne Kaydet
    creator = current_user.full_name if current_user else "Master SuperAdmin"
    log = models.SystemLog(
        level="INFO",
        module="SAAS_PROVISIONING",
        message=f"Yeni firma kuruldu: {tenant.company_name} ({company_code}) - Lisans: {license_key} - İlk Admin: {final_username}"
    )
    db.add(log)

    db.commit()
    db.refresh(tenant)

    # Dışa aktarma modelini zenginleştir
    res = schemas.TenantCompanyOut.model_validate(tenant)
    res.current_admin_count = 1
    res.current_staff_count = 0
    res.active_online_users = 1
    res.estimated_server_cost_usd = server_cost_usd
    res.estimated_server_cost_try = server_cost_try
    res.net_saas_profit_try = net_profit
    return res


@router.get("/tenants", response_model=List[schemas.TenantCompanyOut])
def list_tenants(
    db: Session = Depends(get_db)
):
    """
    Tüm SaaS Abone Firmaları, Lisans Durumları ve Kullanım Kotaları.
    """
    tenants = db.query(models.TenantCompany).order_by(models.TenantCompany.id.asc()).all()
    results = []

    now = datetime.datetime.utcnow()

    for t in tenants:
        # Lisans kalan gün
        days_rem = 0
        if t.license and t.license.end_date:
            delta = t.license.end_date - now
            days_rem = max(0, delta.days)

        # Gerçek kullanıcı sayıları
        admin_count = db.query(models.User).filter(
            (models.User.tenant_id == t.id) & 
            (models.User.role.in_(["ADMIN", "MANAGER"]))
        ).count()
        staff_count = db.query(models.User).filter(
            (models.User.tenant_id == t.id) & 
            (models.User.role == "STAFF")
        ).count()

        slots_count = db.query(models.RackSlot).count() if t.id == 1 else 0

        # Lisans Out nesnesi
        lic_out = None
        if t.license:
            lic_out = schemas.TenantLicenseOut(
                license_key=t.license.license_key,
                plan_type=t.license.plan_type,
                billing_cycle=t.license.billing_cycle,
                subscription_fee=t.license.subscription_fee,
                currency=t.license.currency,
                status=t.license.status,
                start_date=t.license.start_date,
                end_date=t.license.end_date,
                days_remaining=days_rem,
                auto_renew=t.license.auto_renew,
                max_admin_count=t.license.max_admin_count,
                max_staff_count=t.license.max_staff_count,
                max_branches_count=t.license.max_branches_count,
                max_showcase_slots=t.license.max_showcase_slots,
                storage_limit_mb=t.license.storage_limit_mb
            )

        # Maliyet ve Kârlılık Hesabı
        sub_fee = t.license.subscription_fee if t.license else 4000.0
        cycle = t.license.billing_cycle if t.license else "YEARLY"
        monthly_fee = (sub_fee / 12.0) if cycle == "YEARLY" else sub_fee

        server_cost_usd = 4.50 + (admin_count + staff_count) * 0.40 # Kullanıcı başı 0.40$ sunucu CPU/RAM payı
        server_cost_try = round(server_cost_usd * 41.50, 2)
        net_profit = round(monthly_fee - server_cost_try, 2)

        results.append(schemas.TenantCompanyOut(
            id=t.id,
            company_code=t.company_code,
            company_name=t.company_name,
            owner_name=t.owner_name,
            contact_phone=t.contact_phone,
            contact_email=t.contact_email,
            city=t.city,
            tax_id=t.tax_id,
            is_active=t.is_active,
            created_at=t.created_at,
            license=lic_out,
            current_admin_count=max(1, admin_count),
            current_staff_count=staff_count,
            current_branches_count=1,
            current_slots_count=slots_count,
            active_online_users=random.randint(1, max(2, admin_count + staff_count)),
            estimated_server_cost_usd=server_cost_usd,
            estimated_server_cost_try=server_cost_try,
            net_saas_profit_try=net_profit
        ))

    return results


@router.put("/tenants/{tenant_id}/license")
def update_tenant_license(
    tenant_id: int,
    data: schemas.TenantLicenseUpdate,
    db: Session = Depends(get_db)
):
    """
    Lisans Yenileme, Süre Uzatma ve Kullanıcı Kotalarını (Limitleri) Güncelleme.
    """
    lic = db.query(models.TenantLicense).filter(models.TenantLicense.tenant_id == tenant_id).first()
    if not lic:
        raise HTTPException(status_code=404, detail="Firma lisansı bulunamadı.")

    if data.plan_type:
        lic.plan_type = data.plan_type
    if data.billing_cycle:
        lic.billing_cycle = data.billing_cycle
    if data.subscription_fee is not None:
        lic.subscription_fee = data.subscription_fee
    if data.status:
        lic.status = data.status
    if data.max_admin_count is not None:
        lic.max_admin_count = data.max_admin_count
    if data.max_staff_count is not None:
        lic.max_staff_count = data.max_staff_count
    if data.max_branches_count is not None:
        lic.max_branches_count = data.max_branches_count
    if data.max_showcase_slots is not None:
        lic.max_showcase_slots = data.max_showcase_slots

    if data.extend_months and data.extend_months > 0:
        base_date = lic.end_date if lic.end_date > datetime.datetime.utcnow() else datetime.datetime.utcnow()
        lic.end_date = base_date + datetime.timedelta(days=data.extend_months * 30)
        lic.status = "ACTIVE"

    db.commit()
    db.refresh(lic)
    return {"message": "Lisans ve kota limitleri başarıyla güncellendi.", "license_key": lic.license_key, "status": lic.status}


@router.post("/tenants/{tenant_id}/toggle-status")
def toggle_tenant_status(
    tenant_id: int,
    db: Session = Depends(get_db)
):
    """
    Ödeme yapmayan firmanın sistemini tek tıkla askıya alma veya aktifleştirme.
    """
    tenant = db.query(models.TenantCompany).filter(models.TenantCompany.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Firma bulunamadı.")

    tenant.is_active = not tenant.is_active
    if tenant.license:
        tenant.license.status = "ACTIVE" if tenant.is_active else "SUSPENDED"

    db.commit()
    return {
        "tenant_id": tenant.id,
        "company_name": tenant.company_name,
        "is_active": tenant.is_active,
        "license_status": tenant.license.status if tenant.license else "UNKNOWN"
    }


# =========================================================================
# GÜVENLİ YEDEKLEME & FELAKET KURTARMA ENDPOINTLERİ
# =========================================================================

@router.post("/backups")
def trigger_manual_backup(
    tenant_id: Optional[int] = None,
    notes: Optional[str] = "SuperAdmin Manuel Sistem Yedeği",
    db: Session = Depends(get_db)
):
    """
    Tüm veritabanı ve kritik dosyaların canlı yedeğini (Snapshot) alır.
    """
    rec = backup_service.perform_backup(
        tenant_id=tenant_id,
        backup_type="ON_DEMAND",
        notes=notes
    )
    if not rec:
        raise HTTPException(status_code=500, detail="Yedekleme oluşturulamadı.")
    
    return {
        "message": "Sistem veritabanı yedeği başarıyla alındı!",
        "file_name": rec.file_name,
        "file_size_mb": rec.file_size_mb,
        "checksum": rec.checksum,
        "created_at": rec.created_at
    }


@router.get("/backups", response_model=List[schemas.TenantBackupOut])
def list_backups(
    db: Session = Depends(get_db)
):
    """
    Alınmış otomatik gece ve manuel yedekleme kayıtları.
    """
    backups = db.query(models.TenantBackupLog).order_by(models.TenantBackupLog.id.desc()).limit(30).all()
    return backups


@router.get("/backups/{file_name}/download")
def download_backup_file(file_name: str):
    """
    Yedek dosyasını güvenli olarak indirir.
    """
    file_path = os.path.join(backup_service.BACKUP_DIR, file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Yedek dosyası sunucuda bulunamadı.")
    
    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="application/zip"
    )


# =========================================================================
# BULUT ALTYAPI MALİYET & KÂRLILIK ANALİTİĞİ
# =========================================================================

@router.get("/cost-analytics", response_model=schemas.SystemCostAnalyticsOut)
def get_cost_analytics(
    db: Session = Depends(get_db)
):
    """
    Sistemi satan şirket için toplam bulut sunucu maliyeti, MRR/ARR ve net kârlılık.
    """
    tenants = db.query(models.TenantCompany).all()
    total_companies = len(tenants)
    active_licenses = 0
    expired_licenses = 0
    suspended_licenses = 0

    total_mrr = 0.0
    total_arr = 0.0

    now = datetime.datetime.utcnow()

    for t in tenants:
        if t.license:
            st = t.license.status
            fee = t.license.subscription_fee
            cycle = t.license.billing_cycle
            
            if st == "ACTIVE":
                active_licenses += 1
                if cycle == "YEARLY":
                    total_arr += fee
                    total_mrr += fee / 12.0
                else:
                    total_mrr += fee
                    total_arr += fee * 12.0
            elif st == "EXPIRED":
                expired_licenses += 1
            elif st == "SUSPENDED":
                suspended_licenses += 1

    # Kullanıcı Sayımı
    total_users = db.query(models.User).count()
    online_users = max(1, total_companies * 2)

    # AWS Sunucu Tüketim Hesaplaması
    # Base Lightsail/EC2 Sunucu = $10.00
    # Ekstra her 100 firma başına $5.00
    # Veritabanı ve Backup Depolama = $2.50
    total_cloud_cost_usd = 12.50 + (total_companies * 2.80) + (total_users * 0.15)
    usd_rate = 41.50
    total_cloud_cost_try = round(total_cloud_cost_usd * usd_rate, 2)

    net_saas_profit = max(0.0, total_mrr - total_cloud_cost_try)
    margin = (net_saas_profit / total_mrr * 100.0) if total_mrr > 0 else 94.5
    per_user_cost = round(total_cloud_cost_try / max(1, total_users), 2)

    # Son Gece Yedeği Durumu
    last_backup = db.query(models.TenantBackupLog).order_by(models.TenantBackupLog.id.desc()).first()
    backup_status = "Aktif (Gece 03:00 Otomatik)"
    backup_time = None
    if last_backup:
        backup_time = last_backup.created_at.strftime("%d.%m.%Y %H:%M")
        backup_status = f"{last_backup.status} ({last_backup.file_name})"

    return {
        "total_companies": total_companies,
        "active_licenses": active_licenses,
        "expired_licenses": expired_licenses,
        "suspended_licenses": suspended_licenses,
        "total_active_online_users": online_users,
        "total_monthly_recurring_revenue_try": round(total_mrr, 2),
        "total_annual_recurring_revenue_try": round(total_arr, 2),
        "total_cloud_cost_usd": round(total_cloud_cost_usd, 2),
        "total_cloud_cost_try": total_cloud_cost_try,
        "net_saas_profit_try": round(net_saas_profit, 2),
        "profit_margin_percent": round(margin, 1),
        "per_user_cloud_cost_try": per_user_cost,
        "last_nightly_backup_status": backup_status,
        "last_nightly_backup_time": backup_time
    }
