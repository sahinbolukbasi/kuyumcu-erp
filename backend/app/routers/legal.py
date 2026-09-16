import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/v1/legal", tags=["MASAK Kimlik Kaydı & Darphane Hesap Pusulası"])

MASAK_LIMIT_TL = 85000.0

@router.post("/masak-records", response_model=schemas.MasakRecordOut)
def create_masak_record(
    payload: schemas.MasakRecordCreate,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """85.000 TL üzeri altın alım-satımlarında yasal MASAK kimlik tespit formu kaydı"""
    sale = db.query(models.Sale).filter(models.Sale.id == payload.sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="İlgili satış kaydı bulunamadı")

    user_id = current_user.id if current_user else 1

    # TCKN kontrolü (11 haneli sayısal kontrol)
    id_clean = payload.id_number.strip()
    risk_status = "UYGUN"
    if payload.document_type == "TCKN" and (len(id_clean) != 11 or not id_clean.isdigit()):
        risk_status = "BILDIRIM_GEREKLI"

    record = models.MasakRecord(
        sale_id=sale.id,
        customer_name=payload.customer_name,
        id_number=id_clean,
        document_type=payload.document_type,
        birth_year=payload.birth_year,
        nationality=payload.nationality or "T.C.",
        phone=payload.phone,
        address=payload.address,
        occupation=payload.occupation or "Serbest Meslek",
        transaction_amount=payload.transaction_amount,
        gold_weight_grams=payload.gold_weight_grams,
        risk_status=risk_status,
        approved_by_user_id=user_id,
        created_at=datetime.datetime.utcnow()
    )
    db.add(record)

    sale.masak_id_number = id_clean
    sale.masak_form_printed = True

    # Audit log
    sys_log = models.SystemLog(
        level="INFO",
        module="LEGAL",
        message=f"MASAK Kimlik Beyan Formu Kaydedildi: {payload.customer_name} ({id_clean}) - {payload.transaction_amount:,.2f} TL",
        user_name=current_user.full_name if current_user else "Yetkili"
    )
    db.add(sys_log)

    db.commit()
    db.refresh(record)
    return record


@router.get("/masak-records", response_model=List[schemas.MasakRecordOut])
def get_masak_records(db: Session = Depends(get_db)):
    """MASAK yasal denetim defteri dökümü"""
    return db.query(models.MasakRecord).order_by(desc(models.MasakRecord.created_at)).all()


@router.get("/receipt/{sale_id}/pusula", response_model=schemas.OfficialReceiptPusulaOut)
def get_official_receipt_pusula(
    sale_id: int,
    db: Session = Depends(get_db)
):
    """Kuyumculuk Mevzuatına Uygun Resmi Hesap Pusulası (Darphane Damgası & KDV Ayrıştırması)"""
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Satış bulunamadı")

    p = sale.product
    labor_cost = p.labor_cost if p else 1500.0

    # 3065 sayılı KDV Kanunu Madde 17/4-g gereği Külçe Altın ve Has Altın bedeli KDV'den istisnadır.
    # Yalnızca işçilik bedeli üzerinden %20 KDV hesaplanır.
    labor_kdv = round(labor_cost * 0.20, 2)
    gold_base = max(0.0, round(sale.sale_price - (labor_cost + labor_kdv), 2))

    # Has altın karşılığı
    factors = {"24K": 1.0, "22K": 0.916, "18K": 0.750, "14K": 0.585}
    factor = factors.get(sale.purity.upper(), 0.916)
    has_grams = round(sale.weight_grams * factor, 3)

    is_masak_req = sale.sale_price >= MASAK_LIMIT_TL
    masak_text = (
        f"İşbu işlem 5549 sayılı Suç Gelirlerinin Aklanmasının Önlenmesi Hakkında Kanun kapsamında "
        f"MASAK kimlik tespit sınırını ({MASAK_LIMIT_TL:,.0f} TL) aştığından kimlik beyanı kayıt altına alınmıştır."
        if is_masak_req else
        "5549 Sayılı Kanun MASAK kimlik tespit sınırının altındadır."
    )

    return schemas.OfficialReceiptPusulaOut(
        invoice_no=sale.invoice_no or f"SE-PUSULA-{sale.id:05d}",
        date_str=sale.created_at.strftime("%d.%m.%Y %H:%M") if sale.created_at else datetime.datetime.now().strftime("%d.%m.%Y %H:%M"),
        customer_name=sale.customer_name,
        customer_id_number=sale.masak_id_number or "Bireysel Alıcı",
        product_name=sale.product_name,
        category=sale.category,
        purity=f"{sale.purity} ({int(factor*1000)}/1000 Milyem)",
        darphane_hallmark="T.C. Darphane ve Damga Matbaası Genel Müdürlüğü Resmi Ayar Standartlarına Uygundur.",
        weight_grams=sale.weight_grams,
        pure_has_gold_grams=has_grams,
        gold_rate=sale.gold_rate_at_sale or 3045.0,
        gold_base_value=gold_base,
        labor_cost=labor_cost,
        labor_kdv_amount=labor_kdv,
        total_price=sale.sale_price,
        payment_method=sale.payment_method,
        seller_name=sale.sold_by_name or "Sarraf Erdem Yetkili",
        masak_required=is_masak_req,
        masak_declaration=masak_text
    )
