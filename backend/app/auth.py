import json
import datetime
import hashlib
import hmac
import os
import secrets
from typing import Optional
from fastapi import Depends, HTTPException, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from . import models
from . import tenant_scope  # Register the ORM isolation hooks.

security = HTTPBearer(auto_error=False)
SECURE_COOKIES = os.getenv("APP_ENV", "development") == "production"
SESSION_HOURS = 1  # Güvenlik: oturum süresi 1 saat, sayfa kapatılınca otomatik düşer


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 600000).hex()
    return f"pbkdf2_sha256$600000${salt}${digest}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        if hashed.startswith('pbkdf2_sha256$'):
            _, rounds, salt, digest = hashed.split('$')
            candidate = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), int(rounds)).hex()
        else:
            # One-time migration of existing passwords after successful login.
            candidate = hashlib.sha256((password + 'kuyumcu_salt_789').encode()).hexdigest()
            digest = hashed
        return hmac.compare_digest(candidate, digest)
    except (ValueError, TypeError):
        return False


def session_digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


def issue_session(db, response: Response, user=None, master=False):
    token = secrets.token_urlsafe(48)
    csrf = secrets.token_urlsafe(32)
    row = models.AuthSession(id=session_digest(token), user_id=user.id if user else None,
        tenant_id=user.tenant_id if user else None, is_master=master, csrf_token=csrf,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=SESSION_HOURS))
    db.add(row)
    db.commit()
    prefix = 'gg_master' if master else 'gg'
    response.set_cookie(prefix + '_session', token, httponly=True, secure=SECURE_COOKIES,
        samesite='strict', max_age=SESSION_HOURS * 3600, path='/')
    response.set_cookie(prefix + '_csrf', csrf, httponly=False, secure=SECURE_COOKIES,
        samesite='strict', max_age=SESSION_HOURS * 3600, path='/')
    return row


def resolve_session(db, token, master=False):
    if not token or len(token) > 512:
        return None
    row = db.query(models.AuthSession).filter(models.AuthSession.id == session_digest(token),
        models.AuthSession.revoked == False, models.AuthSession.is_master == master,
        models.AuthSession.expires_at > datetime.datetime.utcnow()).first()
    return row


def check_csrf(request, row):
    if request.method not in {'GET', 'HEAD', 'OPTIONS'}:
        csrf = request.headers.get('x-csrf-token', '')
        if not hmac.compare_digest(csrf, row.csrf_token):
            raise HTTPException(403, 'İstek doğrulanamadı. Sayfayı yenileyiniz.')


def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
                     db: Session = Depends(get_db)) -> models.User:
    # Browser sessions use host-only HttpOnly cookies. Legacy JWTs are intentionally invalidated.
    row = resolve_session(db, request.cookies.get('gg_session'))
    if not row:
        raise HTTPException(401, 'Oturumunuz sona erdi. Tekrar giriş yapınız.')
    check_csrf(request, row)
    user = db.query(models.User).filter(models.User.id == row.user_id, models.User.is_active == True).first()
    if not user or user.tenant_id != row.tenant_id or not user.tenant_id:
        raise HTTPException(401, 'Geçersiz firma oturumu.')
    expected = request.headers.get('x-tenant-id')
    if expected is not None and expected != str(user.tenant_id):
        raise HTTPException(409, detail={'code': 'TENANT_CHANGED', 'message': 'Başka sekmede firma oturumu değişti. Yeniden giriş yapınız.'})
    ensure_tenant_access(db, user)
    db.info['tenant_id'] = user.tenant_id
    db.info['branch_id'] = user.branch_id
    request.state.tenant_id = user.tenant_id
    ensure_module_access(db, user, request.url.path)
    return user


def get_current_user_optional(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
                     db: Session = Depends(get_db)):
    # Önce X-Device-Key ile cihaz kimlik doğrulaması dene
    key = request.headers.get('x-device-key')
    if key:
        credential = db.query(models.DeviceCredential).filter(models.DeviceCredential.id == session_digest(key), models.DeviceCredential.revoked == False).first()
        device = db.get(models.IoTDevice, credential.device_id) if credential else None
        if device and device.is_active:
            from types import SimpleNamespace
            principal = SimpleNamespace(tenant_id=device.tenant_id, full_name=f"IoT:{device.device_id}")
            db.info['tenant_id'] = device.tenant_id
            db.info['branch_id'] = device.branch_id
            request.state.device_id = device.device_id
            request.state.tenant_id = device.tenant_id
            return principal
    
    # Browser session dene, yoksa None dön
    row = resolve_session(db, request.cookies.get('gg_session'))
    if not row:
        return None
    user = db.query(models.User).filter(models.User.id == row.user_id, models.User.is_active == True).first()
    if not user or user.tenant_id != row.tenant_id or not user.tenant_id:
        return None
    db.info['tenant_id'] = user.tenant_id
    db.info['branch_id'] = user.branch_id
    request.state.tenant_id = user.tenant_id
    return user


require_current_user = get_current_user


def require_master(request: Request, db: Session = Depends(get_db)):
    row = resolve_session(db, request.cookies.get('gg_master_session'), master=True)
    if not row:
        raise HTTPException(401, 'Master HQ oturumu gerekli.')
    check_csrf(request, row)
    return row


def require_admin(user: models.User = Depends(require_current_user)):
    if user.role != 'ADMIN':
        raise HTTPException(403, 'Yönetici yetkisi gereklidir.')
    return user


def require_alarm_manager(user: models.User = Depends(require_current_user)):
    if user.role not in {'ADMIN', 'MANAGER', 'ALARM_MANAGER'}:
        raise HTTPException(403, 'Alarm yönetimi yetkisi gereklidir.')
    return user


def enforce_login_limit(db, request, username):
    now = datetime.datetime.utcnow()
    # Persisted across workers and restarts. Do not trust forwarded IP headers.
    for subject in [f"ip:{request.client.host if request.client else 'unknown'}", f"account:{username.casefold()}"]:
        key = session_digest(subject)
        row = db.get(models.LoginAttempt, key)
        if not row:
            row = models.LoginAttempt(key=key, failures=0, window_start=now)
            db.add(row)
        if now - row.window_start > datetime.timedelta(minutes=15):
            row.failures, row.window_start = 0, now
        if row.failures >= (50 if subject.startswith('ip:') else 10):
            raise HTTPException(429, 'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyiniz.')
        row.failures += 1
    db.commit()


def ensure_tenant_access(db: Session, user: models.User):
    if not user.tenant_id:
        return
    tenant = db.query(models.TenantCompany).filter(models.TenantCompany.id == user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=403, detail="Firma bulunamadı.")
    lic = tenant.license
    if not tenant.is_active or (lic and lic.status not in {"ACTIVE", "TRIAL"}):
        raise HTTPException(status_code=403, detail="Firmanızın erişimi kapatılmıştır. Lisans yöneticinizle iletişime geçiniz.")
    if lic and lic.end_date and lic.end_date <= datetime.datetime.utcnow():
        raise HTTPException(status_code=403, detail="Firma lisansınızın süresi dolmuştur.")


def ensure_module_access(db: Session, user: models.User, path: str):
    module_routes = {
        "products": "inventory", "inventory": "inventory",
        "sales": "sales", "purchases": "sales", "invoices": "sales",
        "crm": "crm", "cart": "crm", "sessions": "crm",
        "branches": "management", "analytics": "reports",
        "devices": "iot", "iot": "iot",
        "security": "security", "logs": "security", "legal": "security",
    }
    route = path.removeprefix("/api/v1/").split("/")[0]
    module = "management" if path.startswith("/api/v1/auth/users") else module_routes.get(route)
    if not module or not user.tenant_id:
        return
    settings = db.query(models.TenantModuleSetting).filter(models.TenantModuleSetting.tenant_id == user.tenant_id).first()
    if settings:
        try:
            modules = json.loads(settings.modules_json or "{}")
        except (ValueError, TypeError):
            modules = {}
        if modules.get(module) is False:
            raise HTTPException(status_code=403, detail="Bu modül firmanız için Master HQ tarafından kapatılmıştır.")


def ensure_slot_quota(db: Session, tenant_id: int):
    lic = db.query(models.TenantLicense).filter(models.TenantLicense.tenant_id == tenant_id).first()
    count = db.query(models.RackSlot).join(models.Branch, models.RackSlot.branch_id == models.Branch.id).filter(models.Branch.tenant_id == tenant_id).count()
    if lic and count >= lic.max_showcase_slots:
        raise HTTPException(status_code=403, detail="Firma askı / sensör kotası dolmuştur.")


def clear_login_failures(db, request, username):
    for subject in [f"ip:{request.client.host if request.client else 'unknown'}", f"account:{username.casefold()}"]:
        row = db.get(models.LoginAttempt, session_digest(subject))
        if row:
            row.failures = max(0, row.failures - 1) if subject.startswith('ip:') else 0
    db.commit()


def require_iot_access(request: Request, db: Session = Depends(get_db)):
    key = request.headers.get('x-device-key')
    if not key or request.url.path not in {'/api/v1/iot/telemetry', '/api/v1/devices/telemetry', '/api/v1/security/panic-button'}:
        return get_current_user(request, None, db)
    credential = db.query(models.DeviceCredential).filter(models.DeviceCredential.id == session_digest(key), models.DeviceCredential.revoked == False).first()
    device = db.get(models.IoTDevice, credential.device_id) if credential else None
    if not device or not device.is_active or device.tenant_id != credential.tenant_id:
        raise HTTPException(401, 'Geçersiz cihaz anahtarı.')
    from types import SimpleNamespace
    principal = SimpleNamespace(tenant_id=device.tenant_id)
    ensure_tenant_access(db, principal)
    db.info['tenant_id'] = device.tenant_id
    db.info['branch_id'] = device.branch_id
    ensure_module_access(db, principal, request.url.path)
    request.state.device_id = device.device_id
    request.state.tenant_id = device.tenant_id
    return principal


def verify_totp(secret, code, now=None):
    import base64
    import struct
    import time
    if not code or len(code) != 6 or not code.isdigit():
        return False
    try:
        key = base64.b32decode(secret.upper() + '=' * (-len(secret) % 8))
    except Exception:
        return False
    step = int((time.time() if now is None else now) // 30)
    for counter in (step-1, step, step+1):
        digest = hmac.new(key, struct.pack('>Q', counter), hashlib.sha1).digest()
        offset = digest[-1] & 15
        value = (struct.unpack('>I', digest[offset:offset+4])[0] & 0x7fffffff) % 1000000
        if hmac.compare_digest(str(value).zfill(6), code):
            return True
    return False
