from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/v1/auth", tags=["Kullanıcı & Yetkilendirme"])

def serialize_user(user: models.User) -> schemas.UserOut:
    b_name = user.branch.name if user.branch else ("Genel Merkez (Tüm Şubeler)" if user.role == "ADMIN" else "Atanmamış")
    return schemas.UserOut(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        branch_id=user.branch_id,
        branch_name=b_name,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.post("/login", response_model=schemas.TokenOut)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == login_data.username).first()
    if not user or not auth.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu kullanıcı hesabı devre dışı bırakılmıştır."
        )

    token = auth.create_access_token({"sub": str(user.id), "role": user.role, "branch_id": user.branch_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_user(user)
    }


@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(user: models.User = Depends(auth.require_current_user)):
    return serialize_user(user)


@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    current_user: models.User = Depends(auth.require_current_user),
    db: Session = Depends(get_db)
):
    """Admin tüm kullanıcıları, Mağaza Müdürü ise sadece kendi mağazasındaki personelleri görür"""
    if current_user.role == "ADMIN":
        users = db.query(models.User).order_by(models.User.id.asc()).all()
    elif current_user.role == "MANAGER":
        # Kendi mağazasındaki personel ve kendisi
        users = db.query(models.User).filter(
            (models.User.branch_id == current_user.branch_id) | (models.User.id == current_user.id)
        ).order_by(models.User.id.asc()).all()
    else:
        # Normal personel sadece kendi kaydını görebilir
        users = [current_user]

    return [serialize_user(u) for u in users]


@router.post("/users", response_model=schemas.UserOut)
def create_staff_user(
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(auth.require_current_user),
    db: Session = Depends(get_db)
):
    """Admin veya Mağaza Müdürü yeni personel oluşturabilir"""
    if current_user.role not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Personel ekleme yetkiniz bulunmuyor.")

    existing = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor.")

    # Mağaza Müdürü sadece kendi mağazasına STAFF açabilir
    target_branch_id = user_in.branch_id
    target_role = user_in.role
    if current_user.role == "MANAGER":
        target_branch_id = current_user.branch_id
        target_role = "STAFF"

    new_user = models.User(
        username=user_in.username,
        password_hash=auth.hash_password(user_in.password),
        full_name=user_in.full_name,
        role=target_role,
        branch_id=target_branch_id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return serialize_user(new_user)


@router.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user_details(
    user_id: int,
    payload: schemas.UserUpdate,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Sadece Admin: Kullanıcının rolünü, çalıştığı mağazayı ve durumunu günceller"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        if payload.role in ["ADMIN", "MANAGER", "STAFF"]:
            user.role = payload.role
    if payload.branch_id is not None:
        user.branch_id = payload.branch_id if payload.branch_id > 0 else None
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.password_hash = auth.hash_password(payload.password)

    db.commit()
    db.refresh(user)
    return serialize_user(user)


@router.put("/users/{user_id}/toggle-status")
def toggle_user_status(
    user_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Kendi hesabınızı pasife alamazsınız.")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    user.is_active = not user.is_active
    db.commit()
    return {"message": f"Kullanıcı durumu güncellendi: {'Aktif' if user.is_active else 'Pasif'}"}
