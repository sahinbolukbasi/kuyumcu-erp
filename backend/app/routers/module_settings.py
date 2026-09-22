import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..database import get_db


router = APIRouter(prefix="/api/v1/settings", tags=["Firma Modül Ayarları"])

DEFAULT_MODULES = {
    "inventory": True,
    "sales": True,
    "crm": True,
    "management": True,
    "reports": True,
    "iot": True,
    "security": True,
}


def get_tenant_id(current_user: models.User) -> int:
    return getattr(current_user, "tenant_id", None) or 1


def get_or_create_settings(db: Session, tenant_id: int) -> models.TenantModuleSetting:
    settings = db.query(models.TenantModuleSetting).filter(
        models.TenantModuleSetting.tenant_id == tenant_id
    ).first()
    if settings:
        return settings

    settings = models.TenantModuleSetting(
        tenant_id=tenant_id,
        modules_json=json.dumps(DEFAULT_MODULES)
    )
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def serialize_settings(settings: models.TenantModuleSetting) -> schemas.TenantModuleSettingsOut:
    try:
        stored_modules = json.loads(settings.modules_json or "{}")
    except json.JSONDecodeError:
        stored_modules = {}

    modules = {
        **DEFAULT_MODULES,
        **{
            key: bool(value)
            for key, value in stored_modules.items()
            if key in DEFAULT_MODULES
        }
    }
    return schemas.TenantModuleSettingsOut(
        tenant_id=settings.tenant_id,
        modules=modules,
        updated_at=settings.updated_at
    )


@router.get("/modules", response_model=schemas.TenantModuleSettingsOut)
def read_module_settings(
    current_user: models.User = Depends(auth.require_current_user),
    db: Session = Depends(get_db)
):
    settings = get_or_create_settings(db, get_tenant_id(current_user))
    return serialize_settings(settings)


@router.put("/modules", response_model=schemas.TenantModuleSettingsOut)
def update_module_settings(
    payload: schemas.TenantModuleSettingsUpdate,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    raise HTTPException(status_code=403, detail="Firma modülleri yalnızca Master HQ tarafından yönetilebilir.")

    settings = get_or_create_settings(db, get_tenant_id(admin))
    normalized_modules = {
        key: bool(payload.modules.get(key, DEFAULT_MODULES[key]))
        for key in DEFAULT_MODULES
    }
    settings.modules_json = json.dumps(normalized_modules)
    db.commit()
    db.refresh(settings)
    return serialize_settings(settings)