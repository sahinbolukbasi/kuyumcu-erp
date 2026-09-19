import datetime
import json
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..database import get_db
from .. import models, schemas, iot_service, auth

router = APIRouter(prefix="/api/v1/sales", tags=["Satış İşlemleri"])

@router.get("", response_model=List[schemas.SaleOut])
def list_sales(
    user_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    time_range: Optional[str] = "all", # today, week, month, year, all
    category: Optional[str] = None,
    purity: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[models.User] = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Sale)

    # Rol bazlı erişim kısıtlaması:
    if current_user and current_user.role == "STAFF":
        # Normal personel sadece kendi yaptığı satışları görebilir
        query = query.filter(models.Sale.user_id == current_user.id)
    elif current_user and current_user.role == "MANAGER":
        # Mağaza Müdürü sadece kendi mağazasındaki satışları görür
        if current_user.branch_id:
            query = query.filter(models.Sale.branch_id == current_user.branch_id)
    elif branch_id and branch_id > 0:
        # Admin belirli bir mağazayı filtreleyebilir
        query = query.filter(models.Sale.branch_id == branch_id)

    if user_id:
        query = query.filter(models.Sale.user_id == user_id)

    # Zaman filtresi
    now = datetime.datetime.utcnow()
    if time_range == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.Sale.created_at >= start_of_day)
    elif time_range == "week":
        start_of_week = now - datetime.timedelta(days=7)
        query = query.filter(models.Sale.created_at >= start_of_week)
    elif time_range == "month":
        start_of_month = now - datetime.timedelta(days=30)
        query = query.filter(models.Sale.created_at >= start_of_month)
    elif time_range == "year":
        start_of_year = now - datetime.timedelta(days=365)
        query = query.filter(models.Sale.created_at >= start_of_year)

    if category and category != "ALL":
        query = query.filter(models.Sale.category == category)
    if purity and purity != "ALL":
        query = query.filter(models.Sale.purity == purity)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.Sale.product_name.ilike(search_fmt)) |
            (models.Sale.barcode.ilike(search_fmt)) |
            (models.Sale.customer_name.ilike(search_fmt)) |
            (models.Sale.invoice_no.ilike(search_fmt))
        )

    return query.order_by(models.Sale.id.desc()).all()


@router.get("/staff-performance", response_model=List[schemas.StaffPerformance])
def get_staff_performance(
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Admin'e özel: Tüm personellerin kim ne kadar sattı karnesi"""
    users = db.query(models.User).all()
    results = []

    for u in users:
        sales = db.query(models.Sale).filter(models.Sale.user_id == u.id).all()
        total_count = len(sales)
        total_rev = sum(s.sale_price for s in sales)
        total_grams = round(sum(s.weight_grams for s in sales), 2)

        results.append({
            "user_id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "total_sales_count": total_count,
            "total_revenue": total_rev,
            "total_grams_sold": total_grams
        })

    orphan_sales = db.query(models.Sale).filter(models.Sale.user_id.is_(None)).all()
    if orphan_sales:
        results.append({
            "user_id": None,
            "username": "sistem",
            "full_name": "Genel / Mağaza Doğrudan Satış",
            "role": "SYSTEM",
            "total_sales_count": len(orphan_sales),
            "total_revenue": sum(s.sale_price for s in orphan_sales),
            "total_grams_sold": round(sum(s.weight_grams for s in orphan_sales), 2)
        })

    return results


@router.post("/verify-two-man")
def verify_two_man_rule(
    payload: schemas.TwoManApprovalRequest,
    db: Session = Depends(get_db)
):
    """100.000 TL üzeri yüksek tutarlı işlemlerde 2. personel veya yöneticinin şifre onayı"""
    approver = db.query(models.User).filter(
        models.User.username == payload.approver_username,
        models.User.is_active == True
    ).first()

    if not approver or not auth.verify_password(payload.approver_password, approver.password_hash):
        raise HTTPException(status_code=401, detail="2. Personel / Yönetici kullanıcı adı veya şifresi hatalı!")

    return {
        "status": "APPROVED",
        "message": f"İkinci onay başarıyla verildi: {approver.full_name} ({approver.role})",
        "approver_id": approver.id,
        "approver_name": approver.full_name,
        "approver_role": approver.role
    }


@router.get("/cross-sell-recommendations/{product_id}", response_model=List[schemas.CrossSellItemOut])
def get_cross_sell_recommendations(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Satış ekranında seçilen ürün için tamamlayıcı çapraz satış önerileri"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    # Kategoriye göre çapraz öneri haritası
    cat_cross_map = {
        "Bilezik": ["Yüzük", "Küpe", "Kolye"],
        "Yüzük": ["Küpe", "Kolye", "Bilezik"],
        "Kolye": ["Küpe", "Yüzük"],
        "Küpe": ["Yüzük", "Kolye"],
        "Set": ["Bilezik", "Yüzük"],
    }
    target_cats = cat_cross_map.get(product.category, ["Yüzük", "Kolye"])

    # Vitrinde olan diğer ürünlerden seç
    candidates = db.query(models.Product).filter(
        models.Product.id != product.id,
        models.Product.status == "Vitrinde",
        models.Product.category.in_(target_cats)
    ).limit(3).all()

    results = []
    for c in candidates:
        reason = f"{product.name} ile kombin {c.category}"
        if c.purity == product.purity:
            reason = f"{product.purity} uyumlu takım {c.category}"
        results.append(schemas.CrossSellItemOut(
            product_id=c.id,
            name=c.name,
            category=c.category,
            purity=c.purity,
            weight_grams=c.weight_grams,
            price=c.price,
            image_url=c.image_url,
            relation_reason=reason
        ))

    return results


@router.post("", response_model=schemas.SaleOut)
async def process_sale(
    sale_in: schemas.SaleCreate,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == sale_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Satılacak ürün bulunamadı")

    if product.status == "Satıldı":
        raise HTTPException(status_code=400, detail="Bu ürün zaten satılmış")

    slot = product.slot
    slot_id_used = slot.id if slot else None
    slot_number_used = slot.slot_number if slot else None

    final_price = max(0.0, product.price - (sale_in.discount_amount or 0.0))

    # Satışı yapan personel kimliği
    seller_id = sale_in.user_id
    seller_name = sale_in.sold_by_name

    if current_user:
        seller_id = current_user.id
        seller_name = current_user.full_name
    elif not seller_name:
        seller_name = "Yetkili Personel"

    # Fatura / Fiş No üretimi (Örn: SE-2026-0916-XXXX)
    rand_seq = random.randint(1000, 9999)
    date_str = datetime.datetime.utcnow().strftime("%Y%m%d")
    invoice_no = f"SE-{date_str}-{rand_seq}"

    # Müşteri ilişkilendirme
    customer_id = sale_in.customer_id
    customer_name = sale_in.customer_name or "Müşteri"
    customer_phone = sale_in.customer_phone
    customer_email = sale_in.customer_email

    if customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
        if customer:
            customer.total_spent = (customer.total_spent or 0.0) + final_price
            customer.total_items = (customer.total_items or 0) + 1
            customer_name = customer.full_name
            customer_phone = customer.phone or customer_phone
            customer_email = customer.email or customer_email
    elif customer_phone or (customer_name and customer_name != "Müşteri"):
        existing_cust = None
        if customer_phone:
            existing_cust = db.query(models.Customer).filter(models.Customer.phone == customer_phone).first()
        if not existing_cust and customer_name and customer_name != "Müşteri":
            existing_cust = db.query(models.Customer).filter(models.Customer.full_name.ilike(customer_name)).first()

        if existing_cust:
            customer_id = existing_cust.id
            existing_cust.total_spent = (existing_cust.total_spent or 0.0) + final_price
            existing_cust.total_items = (existing_cust.total_items or 0) + 1
            if not existing_cust.phone and customer_phone:
                existing_cust.phone = customer_phone
            if not existing_cust.email and customer_email:
                existing_cust.email = customer_email
            customer_name = existing_cust.full_name
            customer_phone = existing_cust.phone
            customer_email = existing_cust.email
        else:
            new_cust = models.Customer(
                full_name=customer_name if (customer_name and customer_name != "Müşteri") else (f"Müşteri ({customer_phone})" if customer_phone else "Kayıtsız Müşteri"),
                phone=customer_phone,
                email=customer_email,
                customer_type="Bireysel",
                total_spent=final_price,
                total_items=1
            )
            db.add(new_cust)
            db.flush()
            customer_id = new_cust.id
            customer_name = new_cust.full_name

    # Maliyet & Kâr Hesabı
    cost_price = product.cost_price if (product.cost_price and product.cost_price > 0) else round(final_price * 0.82, 2)
    profit_amount = round(final_price - cost_price, 2)
    profit_margin_percent = round((profit_amount / final_price * 100), 1) if final_price > 0 else 0.0

    # Satış kaydı oluştur
    sale = models.Sale(
        invoice_no=invoice_no,
        product_id=product.id,
        product_name=product.name,
        barcode=product.barcode,
        category=product.category,
        purity=product.purity,
        weight_grams=product.weight_grams,
        sale_price=final_price,
        cost_price=cost_price,
        profit_amount=profit_amount,
        profit_margin_percent=profit_margin_percent,
        gold_rate_at_sale=sale_in.gold_rate_at_sale or 3045.0,
        customer_id=customer_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_email=customer_email,
        payment_method=sale_in.payment_method or "Kredi Kartı",
        slot_id=slot_id_used,
        user_id=seller_id,
        sold_by_name=seller_name,
        branch_id=sale_in.branch_id or product.branch_id or 1,
        is_two_man_approved=sale_in.is_two_man_approved or False,
        second_approver_id=sale_in.second_approver_id,
        second_approver_name=sale_in.second_approver_name,
        masak_id_number=sale_in.masak_id_number,
        masak_form_printed=bool(sale_in.masak_id_number),
        created_at=datetime.datetime.utcnow()
    )
    db.add(sale)
    db.flush()

    # MASAK kaydı (Eğer tutar >= 85.000 TL ve kimlik bilgisi varsa)
    if final_price >= 85000.0 and sale_in.masak_id_number:
        masak_rec = models.MasakRecord(
            sale_id=sale.id,
            customer_name=customer_name,
            id_number=sale_in.masak_id_number,
            document_type="TCKN" if len(sale_in.masak_id_number) == 11 else "PASAPORT",
            phone=customer_phone,
            address=sale_in.masak_address or "İstanbul",
            occupation=sale_in.masak_occupation or "Bireysel Alıcı",
            transaction_amount=final_price,
            gold_weight_grams=product.weight_grams,
            approved_by_user_id=seller_id
        )
        db.add(masak_rec)

    product.status = "Satıldı"
    product.custody_user_id = None

    if slot:
        # Askıdan ürünün ağırlığını düş
        slot.expected_weight = max(0.0, round(slot.expected_weight - product.weight_grams, 2))
        slot.current_weight = slot.expected_weight
        slot.status = "NORMAL" if slot.expected_weight > 0 else "EMPTY"
        slot.is_inspection_authorized = False

        active_alerts = db.query(models.SecurityAlert).filter(
            models.SecurityAlert.slot_id == slot.id,
            models.SecurityAlert.is_resolved == False
        ).all()
        for alert in active_alerts:
            alert.is_resolved = True
            alert.resolved_by = f"SATIŞ ({seller_name})"
            alert.resolved_at = datetime.datetime.utcnow()

    # Denetim Günlüğü (Audit Log)
    log = models.SystemLog(
        level="INFO",
        module="SALES",
        message=f"Satış yapıldı: {product.name} ({product.weight_grams}g {product.purity}) -> {customer_name} | {final_price:,.0f} ₺ [Fiş: {invoice_no}] (Kâr: {profit_amount:,.0f} ₺ %{profit_margin_percent})",
        user_id=seller_id,
        user_name=seller_name,
        details_json=json.dumps({
            "sale_id": sale.id,
            "invoice_no": invoice_no,
            "barcode": product.barcode,
            "weight": product.weight_grams,
            "price": final_price,
            "cost": cost_price,
            "profit": profit_amount,
            "two_man": sale.is_two_man_approved,
            "payment": sale.payment_method
        })
    )
    db.add(log)

    db.commit()
    db.refresh(sale)

    # WebSocket üzerinden anons et
    await iot_service.manager.broadcast({
        "type": "PRODUCT_SOLD",
        "sale_id": sale.id,
        "invoice_no": invoice_no,
        "product_id": product.id,
        "product_name": product.name,
        "slot_id": slot_id_used,
        "slot_number": slot_number_used,
        "sale_price": final_price,
        "profit_amount": profit_amount,
        "seller_name": seller_name,
        "customer_name": customer_name,
        "timestamp": sale.created_at.isoformat()
    })

    return sale


@router.post("/daily-reports", response_model=schemas.DailyReportOut)
def save_daily_report(
    payload: schemas.DailyReportCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Gün Sonu Kasa Raporunu Kalıcı Olarak Veritabanına Arşivler"""
    today_str = payload.report_date or datetime.datetime.utcnow().strftime("%Y-%m-%d")
    
    report = models.DailyReport(
        report_date=today_str,
        branch_id=payload.branch_id or current_user.branch_id,
        branch_name=payload.branch_name or "Tüm Şirket Konsolide",
        total_revenue=payload.total_revenue,
        total_gold_grams_sold=payload.total_gold_grams_sold,
        total_sales_count=payload.total_sales_count,
        total_cost=payload.total_cost,
        net_profit=payload.net_profit,
        closed_by_user_id=current_user.id,
        closed_by_name=current_user.full_name,
        sales_summary_json=payload.sales_summary_json,
        notes=payload.notes,
        created_at=datetime.datetime.utcnow()
    )
    db.add(report)

    # Denetim günlüğüne yaz
    audit = models.SystemLog(
        level="INFO",
        module="KASA_GÜN_SONU",
        message=f"{current_user.full_name} tarafından {today_str} Gün Sonu Kasa Kapanışı yapıldı ve arşive kaydedildi. Ciro: {payload.total_revenue:,.2f} ₺, Satılan Altın: {payload.total_gold_grams_sold:.2f} gr.",
        user_id=current_user.id,
        user_name=current_user.full_name,
        details_json=json.dumps({
            "report_date": today_str,
            "revenue": payload.total_revenue,
            "grams": payload.total_gold_grams_sold,
            "sales_count": payload.total_sales_count
        })
    )
    db.add(audit)
    db.commit()
    db.refresh(report)
    return report


@router.get("/daily-reports", response_model=List[schemas.DailyReportOut])
def get_daily_reports(
    limit: int = 60,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Geçmiş Gün Sonu Kasa Raporu Arşivi"""
    return db.query(models.DailyReport).order_by(models.DailyReport.id.desc()).limit(limit).all()
