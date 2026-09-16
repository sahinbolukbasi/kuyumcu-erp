import hashlib
import os
import datetime
from typing import Optional
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from . import models

SECRET_KEY = os.getenv("JWT_SECRET", "kuyumcu_super_secret_jwt_key_2024")
ALGORITHM = "HS256"
SALT = "kuyumcu_salt_789"

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    return hashlib.sha256((password + SALT).encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    # RFC 7519 gereği sub string olmalıdır
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    if not credentials:
        return None
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub_str = payload.get("sub")
        if sub_str is None:
            return None
        user_id = int(sub_str)
    except Exception:
        return None

    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_active == True).first()
    return user

get_current_user_optional = get_current_user

def require_current_user(user: Optional[models.User] = Depends(get_current_user)) -> models.User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Giriş yapmanız gerekmektedir.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_admin(user: models.User = Depends(require_current_user)) -> models.User:
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için sadece Yönetici (Admin) yetkisi gereklidir."
        )
    return user
