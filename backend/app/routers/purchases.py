import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/v1/purchases", tags=["Altın Satın Alma & Hurda Kasa"])

# Ayarlara göre milyem has katsayıları
PURITY_RATIOS = {
    "24K": 0.995,
    "22K": 0.916,
    "18K": 0.750,
    "14K": 0.585,
    "9K": 0.375,
}

@router.post("", response_model=schemas.GoldPurchaseOut)
def create_gold_purchase(
    purchase_data: schemas.GoldPurchaseCreate,
    current_user: Optional[models.User] = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Müşteriden altın / hurda / ziynet satın alma işlemi.
    Altını satın alan personel, müşteri, gramaj, has karşılığı ve ödenen tutar kaydedilir.
    """
    # 1. Ayar ve milyem oranı belirleme
    purity_clean = (purchase_data.purity or "22K").upper().strip()
    ratio = purchase_data.pure_rate_ratio or PURITY_RATIOS.get(purity_clean, 0.916)
    
    # 2. Has altın ve toplam ödeme tutarı hesabı
    weight = float(purchase_data.weight_grams)
    pure_grams = round(weight * ratio, 3)
    
    total_paid = purchase_data.total_amount_paid
    if not total_paid or total_paid <= 0:
        total_paid = round(weight * float(purchase_data.unit_price_per_gram), 2)

    # 3. Otomatik Alım Fiş No / Gider Pusula No Üretme
    now = datetime.datetime.utcnow()
    rand_code = random.randint(1000, 9999)
    receipt_no = f"ALIM-{now.strftime('%Y%m%d')}-{rand_code}"

    # 4. Satın alan personeli tespit et
    buyer_id = current_user.id if current_user else None
    buyer_name = current_user.full_name if current_user else "Yetkili Personel"
    branch_id = current_user.branch_id if current_user and current_user.branch_id else (purchase_data.branch_id or 1)

    # 5. Müşteri CRM Entegrasyonu
    customer_id = None
    if purchase_data.customer_name and purchase_data.customer_name != "Müşteri":
        cust = None
        if purchase_data.customer_phone:
            cust = db.query(models.Customer).filter(models.Customer.phone == purchase_data.customer_phone).first()
        elif purchase_data.customer_tc:
            cust = db.query(models.Customer).filter(models.Customer.id_number == purchase_data.customer_tc).first()
        
        if not cust:
            cust = models.Customer(
                full_name=purchase_data.customer_name,
                phone=purchase_data.customer_phone,
                id_number=purchase_data.customer_tc,
                customer_type="Bireysel Satıcı",
                notes=f"Altın Bozduran Müşteri. İlk Alım: {weight} gr {purity_clean}"
            )
            db.add(cust)
            db.flush()
        customer_id = cust.id

    # 6. Kaydı oluştur
    new_purchase = models.GoldPurchase(
        receipt_no=receipt_no,
        category=purchase_data.category or "Hurda Altın",
        item_description=purchase_data.item_description,
        purity=purity_clean,
        weight_grams=weight,
        pure_rate_ratio=ratio,
        pure_gold_grams=pure_grams,
        unit_price_per_gram=purchase_data.unit_price_per_gram,
        total_amount_paid=total_paid,
        currency=purchase_data.currency or "TRY",
        payment_method=purchase_data.payment_method or "Nakit (Kasa Çıkışı)",
        customer_id=customer_id,
        customer_name=purchase_data.customer_name or "Müşteri",
        customer_tc=purchase_data.customer_tc,
        customer_phone=purchase_data.customer_phone,
        user_id=buyer_id,
        buyer_name=buyer_name,
        branch_id=branch_id,
        storage_location=purchase_data.storage_location or "Hurda / Çıkma Kasası",
        notes=purchase_data.notes,
        created_at=now
    )

    db.add(new_purchase)

    # 7. Sistem Denetim Günlüğüne İşle
    log_entry = models.SystemLog(
        level="INFO",
        module="GOLD_PURCHASE",
        user_id=buyer_id,
        user_name=buyer_name,
        message=f"{buyer_name} tarafından {weight} gr {purity_clean} ({pure_grams} gr Has) altın satın alındı. Ödenen: {total_paid:,.2f} TL (Fiş: {receipt_no})"
    )
    db.add(log_entry)

    db.commit()
    db.refresh(new_purchase)
    return new_purchase


@router.get("", response_model=List[schemas.GoldPurchaseOut])
def list_gold_purchases(
    user_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    time_range: Optional[str] = "all", # today, week, month, year, all
    purity: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[models.User] = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Satın alınan altınların filtrelenebilir listesi.
    Personel bazlı, zaman aralıklı ve arama destekli.
    """
    query = db.query(models.GoldPurchase)

    # Rol bazlı kısıt
    if current_user and current_user.role == "STAFF":
        pass
    elif current_user and current_user.role == "MANAGER":
        if current_user.branch_id:
            query = query.filter(models.GoldPurchase.branch_id == current_user.branch_id)
    elif branch_id and branch_id > 0:
        query = query.filter(models.GoldPurchase.branch_id == branch_id)

    if user_id:
        query = query.filter(models.GoldPurchase.user_id == user_id)

    now = datetime.datetime.utcnow()
    if time_range == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.GoldPurchase.created_at >= start_of_day)
    elif time_range == "week":
        start_of_week = now - datetime.timedelta(days=7)
        query = query.filter(models.GoldPurchase.created_at >= start_of_week)
    elif time_range == "month":
        start_of_month = now - datetime.timedelta(days=30)
        query = query.filter(models.GoldPurchase.created_at >= start_of_month)
    elif time_range == "year":
        start_of_year = now - datetime.timedelta(days=365)
        query = query.filter(models.GoldPurchase.created_at >= start_of_year)

    if purity and purity != "ALL":
        query = query.filter(models.GoldPurchase.purity == purity)
    if category and category != "ALL":
        query = query.filter(models.GoldPurchase.category == category)

    if search:
        s_fmt = f"%{search}%"
        query = query.filter(
            (models.GoldPurchase.receipt_no.ilike(s_fmt)) |
            (models.GoldPurchase.item_description.ilike(s_fmt)) |
            (models.GoldPurchase.customer_name.ilike(s_fmt)) |
            (models.GoldPurchase.customer_tc.ilike(s_fmt)) |
            (models.GoldPurchase.buyer_name.ilike(s_fmt))
        )

    return query.order_by(models.GoldPurchase.id.desc()).all()


@router.get("/staff-summary", response_model=List[schemas.StaffPurchaseSummary])
def get_staff_purchases_summary(
    time_range: Optional[str] = "today",
    db: Session = Depends(get_db)
):
    """
    Hangi kullanıcı/personel ne kadar altın aldı karnesi.
    """
    now = datetime.datetime.utcnow()
    p_query = db.query(models.GoldPurchase)
    if time_range == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        p_query = p_query.filter(models.GoldPurchase.created_at >= start_of_day)
    elif time_range == "week":
        p_query = p_query.filter(models.GoldPurchase.created_at >= now - datetime.timedelta(days=7))
    elif time_range == "month":
        p_query = p_query.filter(models.GoldPurchase.created_at >= now - datetime.timedelta(days=30))
    elif time_range == "year":
        p_query = p_query.filter(models.GoldPurchase.created_at >= now - datetime.timedelta(days=365))

    purchases = p_query.all()
    users = db.query(models.User).all()
    
    results = []
    for u in users:
        u_purchases = [p for p in purchases if p.user_id == u.id]
        total_count = len(u_purchases)
        total_weight = round(sum(p.weight_grams for p in u_purchases), 2)
        total_pure = round(sum(p.pure_gold_grams for p in u_purchases), 3)
        total_paid = round(sum(p.total_amount_paid for p in u_purchases), 2)

        results.append({
            "user_id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "total_purchases_count": total_count,
            "total_weight_grams": total_weight,
            "total_pure_gold_grams": total_pure,
            "total_amount_paid": total_paid
        })

    unassigned = [p for p in purchases if not p.user_id]
    if unassigned:
        results.append({
            "user_id": None,
            "username": "unassigned",
            "full_name": "Diğer / Tanımsız Personel",
            "role": "STAFF",
            "total_purchases_count": len(unassigned),
            "total_weight_grams": round(sum(p.weight_grams for p in unassigned), 2),
            "total_pure_gold_grams": round(sum(p.pure_gold_grams for p in unassigned), 3),
            "total_amount_paid": round(sum(p.total_amount_paid for p in unassigned), 2)
        })

    return results


@router.get("/comparison-summary", response_model=schemas.GoldComparisonSummary)
def get_gold_comparison_summary(
    time_range: Optional[str] = "today", # today, week, month, year, all
    db: Session = Depends(get_db)
):
    """
    GÜN SONU / DÖNEMSEL ALINAN ALTIN İLE SATILAN ALTIN KARŞILAŞTIRMASI:
    - Satılan altın: Adet, Gramaj, Has Karşılığı, Ciro (Gelir)
    - Satın alınan altın: Adet, Gramaj, Has Karşılığı, Ödenen (Gider)
    - Net Denge (Alınan - Satılan Gram, Net Has Değişimi, Net Kasa Nakit Hareketi)
    - Personel bazında kim ne kadar sattı ve kim ne kadar satın aldı karşılaştırması
    """
    now = datetime.datetime.utcnow()
    
    sales_q = db.query(models.Sale)
    purchases_q = db.query(models.GoldPurchase)

    if time_range == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        sales_q = sales_q.filter(models.Sale.created_at >= start_date)
        purchases_q = purchases_q.filter(models.GoldPurchase.created_at >= start_date)
    elif time_range == "week":
        start_date = now - datetime.timedelta(days=7)
        sales_q = sales_q.filter(models.Sale.created_at >= start_date)
        purchases_q = purchases_q.filter(models.GoldPurchase.created_at >= start_date)
    elif time_range == "month":
        start_date = now - datetime.timedelta(days=30)
        sales_q = sales_q.filter(models.Sale.created_at >= start_date)
        purchases_q = purchases_q.filter(models.GoldPurchase.created_at >= start_date)
    elif time_range == "year":
        start_date = now - datetime.timedelta(days=365)
        sales_q = sales_q.filter(models.Sale.created_at >= start_date)
        purchases_q = purchases_q.filter(models.GoldPurchase.created_at >= start_date)

    sales = sales_q.all()
    purchases = purchases_q.all()

    sales_count = len(sales)
    sales_weight = round(sum(s.weight_grams for s in sales), 2)
    sales_pure = 0.0
    for s in sales:
        p_clean = (s.purity or "22K").upper().strip()
        r = PURITY_RATIOS.get(p_clean, 0.916)
        sales_pure += s.weight_grams * r
    sales_pure = round(sales_pure, 3)
    sales_revenue = round(sum(s.sale_price for s in sales), 2)

    purchases_count = len(purchases)
    purchases_weight = round(sum(p.weight_grams for p in purchases), 2)
    purchases_pure = round(sum(p.pure_gold_grams for p in purchases), 3)
    purchases_paid = round(sum(p.total_amount_paid for p in purchases), 2)

    net_weight_balance = round(purchases_weight - sales_weight, 2)
    net_pure_balance = round(purchases_pure - sales_pure, 3)
    net_cash = round(sales_revenue - purchases_paid, 2)

    users = db.query(models.User).all()
    staff_breakdown = []
    for u in users:
        u_sales = [s for s in sales if s.user_id == u.id]
        u_purchases = [p for p in purchases if p.user_id == u.id]

        u_s_weight = round(sum(s.weight_grams for s in u_sales), 2)
        u_s_rev = round(sum(s.sale_price for s in u_sales), 2)
        
        u_p_weight = round(sum(p.weight_grams for p in u_purchases), 2)
        u_p_paid = round(sum(p.total_amount_paid for p in u_purchases), 2)

        staff_breakdown.append({
            "user_id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "sales_count": len(u_sales),
            "sales_weight_grams": u_s_weight,
            "sales_revenue": u_s_rev,
            "purchases_count": len(u_purchases),
            "purchases_weight_grams": u_p_weight,
            "purchases_amount_paid": u_p_paid,
            "net_weight_balance": round(u_p_weight - u_s_weight, 2),
            "net_cash_balance": round(u_s_rev - u_p_paid, 2)
        })

    return {
        "time_range": time_range or "today",
        "sales_count": sales_count,
        "sales_total_weight_grams": sales_weight,
        "sales_total_pure_gold_grams": sales_pure,
        "sales_total_revenue": sales_revenue,
        "purchases_count": purchases_count,
        "purchases_total_weight_grams": purchases_weight,
        "purchases_total_pure_gold_grams": purchases_pure,
        "purchases_total_amount_paid": purchases_paid,
        "net_weight_grams_balance": net_weight_balance,
        "net_pure_gold_grams_balance": net_pure_balance,
        "net_cash_flow": net_cash,
        "staff_breakdown": staff_breakdown
    }
