import os
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from .. import auth
from ..database import get_db

router = APIRouter(prefix='/api/v1/master-auth', tags=['Master oturumu'])

class MasterLogin(BaseModel):
    password: str = Field(min_length=1, max_length=512)
    otp: str = Field(default="", max_length=6)

@router.post('/login')
def login(payload: MasterLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    auth.enforce_login_limit(db, request, '__master__')
    configured = os.getenv('MASTER_PASSWORD_HASH', '')
    if not configured or not auth.verify_password(payload.password, configured):
        raise HTTPException(401, 'Master kimlik bilgileri geçersiz.')
    secret = os.getenv('MASTER_TOTP_SECRET', '')
    if (secret or auth.SECURE_COOKIES) and not auth.verify_totp(secret, payload.otp):
        raise HTTPException(401, 'Master kimlik bilgileri geçersiz.')
    auth.clear_login_failures(db, request, "__master__")
    previous = auth.resolve_session(db, request.cookies.get('gg_master_session'), master=True)
    if previous:
        previous.revoked = True
    auth.issue_session(db, response, master=True)
    return {'authenticated': True}

@router.get('/me')
def me(session=Depends(auth.require_master)):
    return {'authenticated': True}

@router.post('/logout')
def logout(response: Response, session=Depends(auth.require_master), db: Session = Depends(get_db)):
    session.revoked = True
    db.commit()
    for name in ('gg_master_session', 'gg_master_csrf'):
        response.delete_cookie(name, path='/', secure=auth.SECURE_COOKIES, samesite='strict')
    return {'authenticated': False}
