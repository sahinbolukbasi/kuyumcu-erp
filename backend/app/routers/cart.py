# ==============================================================================
# 💎 Golden Guard IoT ERP - Müşteri Sepeti & Hizmet Sistemi Router'ı
# ==============================================================================
# Bu modül:
# 1. Sepet oluşturma, ürün ekleme/çıkarma
# 2. Canlı kur ile anlık fiyat hesaplama
# 3. Sepeti toplu satışa/faturaya dönüştürme
# 4. Müşteri hatırlatıcı ve talep yönetimi
# 5. Sepet analitiği (Admin Dashboard)
# 6. Tüm işlemler SystemLog'a kaydedilir
# ==============================================================================

import datetime
import json
import random
import string
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from ..database import get_db
from .. import models, schemas, auth, exchange_rate_service

router = APIRouter(prefix="/api/v1/cart", tags=["Müşteri Sepeti & Hizmet Sistemi"])


# =========================================================================
# YARDIMCI FONKSİYONLAR
# =========================================================================

def generate_cart_code() -> str:
    """Sepet kodu üretir: SEP-20260919-XXXX"""
    now = datetime.datetime.utcnow()
    date_str = now.strftime("%Y%m%d")
    rand_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"SEP-{date_str}-{rand_str}"


def calculate_cart_totals(cart: models.CustomerCart, db: Session):
    """Sepetteki tüm kalemlerin maliyetlerini yeniden hesaplar"""
    items = db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).all()

    total_gross = 0.0
    total_vat = 0.0
    total_vat_exempt = 0.0
    total_labor = 0.0

    for item in items:
        total_gross += item.line_total or 0.0
        total_vat += item.vat_amount or 0.0
        total_labor += item.labor_cost or 0.0
        if item.is_vat_exempt:
            total_vat_exempt += item.line_total or 0.0

    cart.total_gross_amount = round(total_gross, 2)
    cart.total_vat_amount = round(total_vat, 2)
    cart.total_vat_exempt_amount = round(total_vat_exempt, 2)
    cart.total_labor_cost = round(total_labor, 2)
    cart.total_payable_amount = round(total_gross, 2)

    # Canlı kuru al
    try:
        rates = exchange_rate_service.get_live_rates()
        cart.gold_rate_at_cart = rates.get("rates", {}).get("HAS_ALTIN", {}).get("sell", 0)
    except Exception:
        cart.gold_rate_at_cart = 0

    db.commit()


def calculate_item_totals(
    product: models.Product,
    quantity: int = 1,
    discount_amount: float = 0.0,
    variant: Optional[models.ProductVariant] = None
) -> dict:
    """Bir ürün kalemi için fiyat hesaplaması yapar (canlı kur + işçilik + KDV)"""
    from ..invoice_math import money
    if quantity <= 0 or discount_amount < 0:
        raise HTTPException(422, 'Miktar pozitif, indirim sıfır veya pozitif olmalıdır.')
    price = money(product.price)
    discount = money(discount_amount)
    if discount > price:
        raise HTTPException(422, 'İndirim birim satış fiyatını aşamaz.')
    # Product prices are final VAT-inclusive selling prices. Tax classification belongs to the invoice.
    return {'unit_price':float(price), 'labor_cost':0, 'vat_rate':0, 'vat_amount':0,
        'is_vat_exempt':False, 'discount_amount':float(discount), 'line_total':float((price-discount)*quantity),
        'weight_grams':variant.weight_grams if variant else product.weight_grams,
        'purity':product.purity,'category':product.category}


def log_cart_action(db: Session, level: str, module: str, message: str, user_id: int = None, user_name: str = None, details: dict = None):
    """Sistem log'una kayıt ekler"""
    log = models.SystemLog(
        level=level,
        module=module,
        message=message,
        user_id=user_id,
        user_name=user_name,
        details_json=json.dumps(details) if details else None,
        created_at=datetime.datetime.utcnow()
    )
    db.add(log)
    db.commit()


# =========================================================================
# 1. SEPET CRUD API'LERİ
# =========================================================================

@router.post("", response_model=schemas.CartOut)
def create_cart(
    cart_in: schemas.CartCreate,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Yeni müşteri sepeti oluşturur. Servis başlatma ile eşdeğerdir."""
    user_id = current_user.id if current_user else 1
    user_name = current_user.full_name if current_user else "Personel"
    branch_id = current_user.branch_id if current_user and current_user.branch_id else 1

    # Müşteri bilgilerini CRM'den al
    customer_id = cart_in.customer_id
    customer_name = cart_in.customer_name
    customer_phone = cart_in.customer_phone
    customer_email = cart_in.customer_email

    if customer_id:
        cust = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
        if cust:
            customer_name = cust.full_name
            customer_phone = cust.phone or customer_phone
            customer_email = cust.email or customer_email

    # Servis seansı başlat
    session = models.ServiceSession(
        user_id=user_id,
        customer_name=customer_name or "Müşteri",
        started_at=datetime.datetime.utcnow(),
        sale_made=False
    )
    db.add(session)
    db.flush()

    # Sepet oluştur
    cart = models.CustomerCart(
        cart_code=generate_cart_code(),
        customer_id=customer_id,
        customer_name=customer_name,
        customer_phone=customer_phone,
        customer_email=customer_email,
        user_id=user_id,
        user_name=user_name,
        branch_id=branch_id,
        session_id=session.id,
        status="ACTIVE",
        service_type=cart_in.service_type,
        notes=cart_in.notes,
        customer_wish=cart_in.customer_wish,
        started_at=datetime.datetime.utcnow()
    )
    db.add(cart)
    db.commit()
    db.refresh(cart)

    # Log
    log_cart_action(db, "INFO", "CART",
        f"🛒 Yeni sepet açıldı: {cart.cart_code} - {customer_name or 'Müşteri'} ({user_name})",
        user_id, user_name, {"cart_id": cart.id, "cart_code": cart.cart_code})

    return cart


@router.get("/active", response_model=Optional[schemas.CartOut])
def get_active_cart(
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Personelin aktif sepetini getirir"""
    user_id = current_user.id if current_user else 1
    cart = db.query(models.CustomerCart).filter(
        models.CustomerCart.user_id == user_id,
        models.CustomerCart.status == "ACTIVE"
    ).order_by(desc(models.CustomerCart.created_at)).first()

    if not cart:
        return None

    # Süre hesapla
    if cart.started_at:
        diff = (datetime.datetime.utcnow() - cart.started_at).total_seconds()
        cart.duration_minutes = round(diff / 60.0, 1)

    return cart


@router.get("/{cart_id}", response_model=schemas.CartOut)
def get_cart(
    cart_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Sepet detayını getirir (ürünlerle birlikte)"""
    cart = db.query(models.CustomerCart).filter(models.CustomerCart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Sepet bulunamadı")

    # Süre hesapla
    if cart.started_at and cart.status == "ACTIVE":
        diff = (datetime.datetime.utcnow() - cart.started_at).total_seconds()
        cart.duration_minutes = round(diff / 60.0, 1)

    return cart


@router.put("/{cart_id}", response_model=schemas.CartOut)
def update_cart(
    cart_id: int,
    cart_in: schemas.CartUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Sepet bilgilerini günceller"""
    cart = db.query(models.CustomerCart).filter(models.CustomerCart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Sepet bulunamadı")

    update_dict = cart_in.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(cart, key, value)

    db.commit()
    db.refresh(cart)
    return cart


@router.post("/{cart_id}/close", response_model=schemas.CartOut)
def close_cart(
    cart_id: int,
    status: str = Body("CLOSED", embed=True),
    notes: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Sepeti kapatır (servis biter, kronometre durur)"""
    cart = db.query(models.CustomerCart).filter(models.CustomerCart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Sepet bulunamadı")

    now = datetime.datetime.utcnow()
    cart.status = status
    cart.closed_at = now
    if cart.started_at:
        diff = (now - cart.started_at).total_seconds()
        cart.duration_minutes = round(diff / 60.0, 1)
    if notes:
        cart.notes = (cart.notes or "") + f"\n[KAPATILDI] {notes}"

    # Servis seansını da kapat
    if cart.session_id:
        session = db.query(models.ServiceSession).filter(models.ServiceSession.id == cart.session_id).first()
        if session and not session.ended_at:
            session.ended_at = now
            session.duration_minutes = cart.duration_minutes
            session.sale_made = any(item.is_sold for item in cart.items)

    db.commit()
    db.refresh(cart)

    log_cart_action(db, "INFO", "CART",
        f"📦 Sepet kapatıldı: {cart.cart_code} ({status}) - {cart.duration_minutes} dk",
        current_user.id if current_user else None,
        current_user.full_name if current_user else None,
        {"cart_id": cart.id, "status": status, "duration": cart.duration_minutes})

    return cart


# =========================================================================
# 2. SEPET KALEMLERİ (ÜRÜN EKLE/ÇIKAR) & HIZLI SEPETE AT
# =========================================================================

@router.post("/quick-add", response_model=dict)
def quick_add_to_cart(
    payload: dict = Body(...),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Vitrinden, masadan veya stoktan tek tıkla sepete ürün ekler.
    Aktif sepet yoksa otomatik yeni sepet oluşturur.
    """
    product_id = payload.get("product_id")
    if not product_id:
        raise HTTPException(status_code=400, detail="product_id zorunludur")

    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    if product.status == "Satıldı":
        raise HTTPException(status_code=400, detail="Bu ürün zaten satılmış")

    user_id = current_user.id if current_user else 1
    user_name = current_user.full_name if current_user else "Yetkili Personel"
    branch_id = current_user.branch_id if current_user and current_user.branch_id else (product.branch_id or 1)
    tenant_id = current_user.tenant_id if current_user and hasattr(current_user, 'tenant_id') else (product.tenant_id or 1)

    # 1. Aktif sepet ara (kullanıcıya ve tenant'a ait)
    cart = db.query(models.CustomerCart).filter(
        models.CustomerCart.user_id == user_id,
        models.CustomerCart.status == "ACTIVE"
    ).order_by(desc(models.CustomerCart.id)).first()

    # Yoksa yeni sepet aç
    if not cart:
        cart = models.CustomerCart(
            cart_code=generate_cart_code(),
            user_id=user_id,
            user_name=user_name,
            branch_id=branch_id,
            tenant_id=tenant_id,
            status="ACTIVE",
            service_type="SHOWROOM",
            started_at=datetime.datetime.utcnow()
        )
        db.add(cart)
        db.flush()

    # 2. Ürün sepette zaten var mı kontrol et
    existing_item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.product_id == product.id,
        models.CartItem.is_sold == False
    ).first()

    if existing_item:
        existing_item.quantity += 1
        existing_item.line_total = round(existing_item.unit_price * existing_item.quantity, 2)
    else:
        # Fiyat ve detaylar
        totals = calculate_item_totals(product, 1, 0.0, None)
        cart_item = models.CartItem(
            cart_id=cart.id,
            product_id=product.id,
            product_name=product.name,
            barcode=product.barcode,
            category=product.category,
            purity=product.purity,
            weight_grams=product.weight_grams,
            quantity=1,
            unit_price=totals["unit_price"],
            labor_cost=totals["labor_cost"],
            vat_rate=totals["vat_rate"],
            vat_amount=totals["vat_amount"],
            line_total=totals["line_total"],
            is_vat_exempt=True
        )
        db.add(cart_item)

    db.flush()
    calculate_cart_totals(cart, db)

    # Toplam sepetteki ürün adedini say
    total_items = db.query(func.sum(models.CartItem.quantity)).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.is_sold == False
    ).scalar() or 0

    return {
        "status": "success",
        "message": f"'{product.name}' sepete eklendi.",
        "cart_id": cart.id,
        "cart_code": cart.cart_code,
        "total_items": int(total_items),
        "total_payable": cart.total_payable_amount
    }


@router.post("/{cart_id}/items", response_model=schemas.CartItemOut)
def add_cart_item(
    cart_id: int,
    item_in: schemas.CartItemCreate,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Sepete ürün ekler. Canlı kur ile anlık fiyat hesaplar."""
    cart = db.query(models.CustomerCart).filter(
        models.CustomerCart.id == cart_id,
        models.CustomerCart.status == "ACTIVE"
    ).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Aktif sepet bulunamadı")

    product = db.query(models.Product).filter(models.Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    # Varyant kontrolü
    variant = None
    if item_in.variant_id:
        variant = db.query(models.ProductVariant).filter(
            models.ProductVariant.id == item_in.variant_id,
            models.ProductVariant.product_id == product.id
        ).first()

    # Fiyat hesapla
    totals = calculate_item_totals(product, item_in.quantity, item_in.discount_amount, variant)

    # Sepet kalemi oluştur
    cart_item = models.CartItem(
        cart_id=cart.id,
        product_id=product.id,
        variant_id=item_in.variant_id,
        product_name=product.name,
        barcode=product.barcode,
        category=product.category,
        purity=product.purity,
        weight_grams=totals["weight_grams"],
        quantity=item_in.quantity,
        unit_price=totals["unit_price"],
        labor_cost=totals["labor_cost"],
        vat_rate=totals["vat_rate"],
        vat_amount=totals["vat_amount"],
        is_vat_exempt=totals["is_vat_exempt"],
        discount_amount=totals["discount_amount"],
        line_total=totals["line_total"],
        was_shown_to_customer=True,
        customer_reaction=item_in.customer_reaction,
        inspection_seconds=item_in.inspection_seconds or 0,
        is_sold=False
    )
    db.add(cart_item)
    db.flush()

    # Sepet toplamlarını güncelle
    calculate_cart_totals(cart, db)

    # Ürünün view_count'ini artır
    product.view_count = (product.view_count or 0) + 1
    product.total_inspection_seconds = (product.total_inspection_seconds or 0) + (item_in.inspection_seconds or 0)

    # Müşteri ilgi kaydı
    if cart.customer_id:
        interest = models.CustomerInterest(
            customer_id=cart.customer_id,
            product_id=product.id,
            user_id=current_user.id if current_user else None,
            branch_id=cart.branch_id,
            action_type="LIKED" if item_in.customer_reaction == "BEGENDI" else "SHOWN",
            notes=f"Sepet {cart.cart_code} - Tepki: {item_in.customer_reaction or 'Gösterildi'}"
        )
        db.add(interest)

    db.commit()
    db.refresh(cart_item)

    # Log
    log_cart_action(db, "INFO", "CART",
        f"➕ Sepete ürün eklendi: {product.name} ({cart.cart_code})",
        current_user.id if current_user else None,
        current_user.full_name if current_user else None,
        {"cart_id": cart_id, "product_id": product.id, "quantity": item_in.quantity, "total": totals["line_total"]})

    return cart_item


@router.put("/{cart_id}/items/{item_id}", response_model=schemas.CartItemOut)
def update_cart_item(
    cart_id: int,
    item_id: int,
    item_in: schemas.CartItemUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Sepet kalemini günceller (adet, iskonto, müşteri tepkisi)"""
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.cart_id == cart_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Sepet kalemi bulunamadı")

    update_dict = item_in.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(item, key, value)

    # Fiyatı yeniden hesapla (adet/iskonto değiştiyse)
    if "quantity" in update_dict or "discount_amount" in update_dict:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if product:
            totals = calculate_item_totals(product, item.quantity, item.discount_amount)
            item.unit_price = totals["unit_price"]
            item.labor_cost = totals["labor_cost"]
            item.vat_amount = totals["vat_amount"]
            item.line_total = totals["line_total"]

    db.commit()
    db.refresh(item)

    # Sepet toplamlarını güncelle
    cart = db.query(models.CustomerCart).filter(models.CustomerCart.id == cart_id).first()
    if cart:
        calculate_cart_totals(cart, db)

    return item


@router.delete("/{cart_id}/items/{item_id}", response_model=dict)
def remove_cart_item(
    cart_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Sepetten ürün çıkarır"""
    item = db.query(models.CartItem).filter(
        models.CartItem.id == item_id,
        models.CartItem.cart_id == cart_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Sepet kalemi bulunamadı")

    product_name = item.product_name
    db.delete(item)
    db.commit()

    # Sepet toplamlarını güncelle
    cart = db.query(models.CustomerCart).filter(models.CustomerCart.id == cart_id).first()
    if cart:
        calculate_cart_totals(cart, db)

    log_cart_action(db, "INFO", "CART",
        f"➖ Sepetten ürün çıkarıldı: {product_name}",
        current_user.id if current_user else None,
        current_user.full_name if current_user else None)

    return {"success": True, "message": f"{product_name} sepetten çıkarıldı."}


# =========================================================================
# 3. SEPETTEN SATIŞ & FATURA DÖNÜŞTÜRME
# =========================================================================

@router.post("/{cart_id}/convert-to-sale", response_model=dict)
def convert_cart_to_sale(
    cart_id: int,
    sale_in: schemas.CartConvertToSale,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Sepetteki ürünleri toplu satışa dönüştürür.
    Her ürün için ayrı Sale kaydı oluşturur.
    """
    cart = db.query(models.CustomerCart).filter(models.CustomerCart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Sepet bulunamadı")

    items_to_sell = cart.items
    if sale_in.item_ids:
        items_to_sell = [it for it in cart.items if it.id in sale_in.item_ids]

    if not items_to_sell:
        raise HTTPException(status_code=400, detail="Satılacak ürün bulunamadı")

    seller_id = current_user.id if current_user else cart.user_id
    seller_name = current_user.full_name if current_user else cart.user_name

    sales_created = []
    total_revenue = 0.0

    for item in items_to_sell:
        if item.is_sold:
            continue

        # Satış fiş no üret
        rand_seq = random.randint(1000, 9999)
        date_str = datetime.datetime.utcnow().strftime("%Y%m%d")
        invoice_no = f"SEP-{date_str}-{rand_seq}"

        # Satış kaydı oluştur
        sale = models.Sale(
            invoice_no=invoice_no,
            product_id=item.product_id,
            product_name=item.product_name,
            barcode=item.barcode,
            category=item.category or "",
            purity=item.purity or "22K",
            weight_grams=item.weight_grams,
            sale_price=item.line_total,
            cost_price=round(item.line_total * 0.82, 2),
            profit_amount=round(item.line_total * 0.18, 2),
            profit_margin_percent=18.0,
            gold_rate_at_sale=cart.gold_rate_at_cart,
            customer_id=cart.customer_id,
            customer_name=cart.customer_name or "Müşteri",
            customer_phone=cart.customer_phone,
            customer_email=cart.customer_email,
            payment_method=sale_in.payment_method,
            slot_id=None,
            user_id=seller_id,
            sold_by_name=seller_name,
            branch_id=cart.branch_id,
            tenant_id=getattr(cart, 'tenant_id', 1) or 1,
            created_at=datetime.datetime.utcnow()
        )
        db.add(sale)
        db.flush()

        # Sepet kalemini güncelle
        item.is_sold = True
        item.sale_id = sale.id

        # Ürün durumunu güncelle
        if item.product_id:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product.status = "Satıldı"
                # IoT slot güncellemesi
                if product.slot:
                    product.slot.expected_weight = max(0, product.slot.expected_weight - item.weight_grams)
                    product.slot.current_weight = max(0, product.slot.current_weight - item.weight_grams)

        # CRM müşteri güncellemesi
        if cart.customer_id:
            cust = db.query(models.Customer).filter(models.Customer.id == cart.customer_id).first()
            if cust:
                cust.total_spent = (cust.total_spent or 0) + item.line_total
                cust.total_items = (cust.total_items or 0) + 1

        total_revenue += item.line_total
        sales_created.append({
            "sale_id": sale.id,
            "invoice_no": invoice_no,
            "product_name": item.product_name,
            "amount": item.line_total
        })

    # Sepet toplamlarını güncelle
    calculate_cart_totals(cart, db)

    # Eğer satılmamış ürün kalmadıysa sepeti kapat
    remaining_unsold = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.is_sold == False
    ).count()

    if remaining_unsold == 0:
        cart.status = "CONVERTED"
        cart.closed_at = datetime.datetime.utcnow()
        if cart.started_at:
            delta = cart.closed_at - cart.started_at
            cart.duration_minutes = round(delta.total_seconds() / 60, 1)

    # Servis seansını güncelle
    if cart.session_id:
        session = db.query(models.ServiceSession).filter(models.ServiceSession.id == cart.session_id).first()
        if session:
            session.sale_made = True

    log_cart_action(db, "INFO", "CART_SALE",
        f"💰 Sepet satışa dönüştürüldü: {cart.cart_code} - {len(sales_created)} ürün - {total_revenue:,.2f} ₺",
        seller_id, seller_name,
        {"cart_id": cart_id, "sales_count": len(sales_created), "total_revenue": total_revenue})

    db.commit()

    return {
        "success": True,
        "message": f"{len(sales_created)} ürün başarıyla satıldı.",
        "total_revenue": total_revenue,
        "sales": sales_created,
        "cart_code": cart.cart_code
    }


@router.post("/{cart_id}/convert-to-invoice", response_model=dict)
def convert_cart_to_invoice(
    cart_id: int,
    invoice_in: schemas.CartConvertToInvoice,
    current_user: Optional[models.User] = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """
    Sepetteki satılmış ürünler için toplu fatura keser.
    Önce satışa dönüştürülmüş olmalı.
    """
    raise HTTPException(409, 'Fatura Taslakları ekranında her satış için alıcı adresi ve vergi uygulaması girilmelidir.')


@router.get("", response_model=List[schemas.CartOut])
def list_carts(
    status: Optional[str] = None,
    user_id: Optional[int] = None,
    branch_id: Optional[int] = None,
    time_range: Optional[str] = "all",
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Sepet geçmişini listeler"""
    query = db.query(models.CustomerCart)

    # Rol bazlı kısıtlama
    if current_user and current_user.role == "STAFF":
        query = query.filter(models.CustomerCart.user_id == current_user.id)
    elif current_user and current_user.role == "MANAGER" and current_user.branch_id:
        query = query.filter(models.CustomerCart.branch_id == current_user.branch_id)
    elif branch_id and branch_id > 0:
        query = query.filter(models.CustomerCart.branch_id == branch_id)

    if user_id:
        query = query.filter(models.CustomerCart.user_id == user_id)
    if status and status != "ALL":
        query = query.filter(models.CustomerCart.status == status)

    # Zaman filtresi
    now = datetime.datetime.utcnow()
    if time_range == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.CustomerCart.created_at >= start)
    elif time_range == "week":
        query = query.filter(models.CustomerCart.created_at >= now - datetime.timedelta(days=7))
    elif time_range == "month":
        query = query.filter(models.CustomerCart.created_at >= now - datetime.timedelta(days=30))

    if search:
        sf = f"%{search}%"
        query = query.filter(
            (models.CustomerCart.cart_code.ilike(sf)) |
            (models.CustomerCart.customer_name.ilike(sf)) |
            (models.CustomerCart.user_name.ilike(sf))
        )

    return query.order_by(desc(models.CustomerCart.created_at)).offset(skip).limit(limit).all()


# =========================================================================
# 5. HATIRLATICI API'LERİ
# =========================================================================

@router.post("/reminders", response_model=schemas.ReminderOut)
def create_reminder(
    reminder_in: schemas.ReminderCreate,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Müşteri için hatırlatıcı oluşturur"""
    user_id = current_user.id if current_user else 1
    user_name = current_user.full_name if current_user else "Personel"

    reminder = models.CustomerReminder(
        cart_id=reminder_in.cart_id,
        customer_id=reminder_in.customer_id,
        customer_name=reminder_in.customer_name,
        customer_phone=reminder_in.customer_phone,
        user_id=user_id,
        user_name=user_name,
        reminder_type=reminder_in.reminder_type,
        title=reminder_in.title,
        note=reminder_in.note,
        reminder_date=reminder_in.reminder_date,
        product_id=reminder_in.product_id,
        product_name=reminder_in.product_name
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    log_cart_action(db, "INFO", "REMINDER",
        f"🔔 Hatırlatıcı oluşturuldu: {reminder.title} - {reminder.reminder_date.strftime('%d.%m.%Y %H:%M')}",
        user_id, user_name)

    return reminder


@router.get("/reminders", response_model=List[schemas.ReminderOut])
def list_reminders(
    is_completed: Optional[bool] = None,
    reminder_type: Optional[str] = None,
    upcoming_days: Optional[int] = 7,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Hatırlatıcıları listeler"""
    query = db.query(models.CustomerReminder)

    if is_completed is not None:
        query = query.filter(models.CustomerReminder.is_completed == is_completed)
    if reminder_type:
        query = query.filter(models.CustomerReminder.reminder_type == reminder_type)
    if upcoming_days and upcoming_days > 0:
        deadline = datetime.datetime.utcnow() + datetime.timedelta(days=upcoming_days)
        query = query.filter(models.CustomerReminder.reminder_date <= deadline)

    return query.order_by(models.CustomerReminder.reminder_date.asc()).all()


@router.put("/reminders/{reminder_id}", response_model=schemas.ReminderOut)
def update_reminder(
    reminder_id: int,
    reminder_in: schemas.ReminderUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Hatırlatıcıyı günceller (tamamla, ertele vb.)"""
    reminder = db.query(models.CustomerReminder).filter(models.CustomerReminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")

    update_dict = reminder_in.model_dump(exclude_unset=True)
    if "is_completed" in update_dict and update_dict["is_completed"]:
        reminder.completed_at = datetime.datetime.utcnow()

    for key, value in update_dict.items():
        setattr(reminder, key, value)

    db.commit()
    db.refresh(reminder)
    return reminder


# =========================================================================
# 6. MÜŞTERİ TALEP API'LERİ
# =========================================================================

@router.post("/demands", response_model=schemas.DemandOut)
def create_demand(
    demand_in: schemas.DemandCreate,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Müşteri talebi kaydeder (mağazada bulunamayan model)"""
    user_id = current_user.id if current_user else 1
    user_name = current_user.full_name if current_user else "Personel"
    branch_id = current_user.branch_id if current_user and current_user.branch_id else 1

    demand = models.CustomerDemand(
        cart_id=demand_in.cart_id,
        customer_id=demand_in.customer_id,
        customer_name=demand_in.customer_name,
        customer_phone=demand_in.customer_phone,
        user_id=user_id,
        user_name=user_name,
        branch_id=branch_id,
        requested_model=demand_in.requested_model,
        category=demand_in.category,
        purity=demand_in.purity,
        weight_grams=demand_in.weight_grams,
        approx_budget=demand_in.approx_budget,
        is_urgent=demand_in.is_urgent,
        notes=demand_in.notes
    )
    db.add(demand)
    db.commit()
    db.refresh(demand)

    log_cart_action(db, "INFO", "DEMAND",
        f"📝 Müşteri talebi kaydedildi: {demand.requested_model} ({demand_in.customer_name or 'Müşteri'})",
        user_id, user_name)

    return demand


@router.get("/demands", response_model=List[schemas.DemandOut])
def list_demands(
    status: Optional[str] = None,
    category: Optional[str] = None,
    is_urgent: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    """Müşteri taleplerini listeler"""
    query = db.query(models.CustomerDemand)
    if status:
        query = query.filter(models.CustomerDemand.status == status)
    if category:
        query = query.filter(models.CustomerDemand.category == category)
    if is_urgent is not None:
        query = query.filter(models.CustomerDemand.is_urgent == is_urgent)
    return query.order_by(desc(models.CustomerDemand.created_at)).all()


# =========================================================================
# 7. SEPET ANALİTİĞİ (ADMİN DASHBOARD)
# =========================================================================

@router.get("/analytics/metrics", response_model=schemas.CartMetricsOut)
def get_cart_metrics(
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Sepet analitiği - Admin Dashboard için"""
    now = datetime.datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - datetime.timedelta(days=7)
    month_start = now - datetime.timedelta(days=30)

    # Aktif sepetler
    active_carts = db.query(models.CustomerCart).filter(
        models.CustomerCart.status == "ACTIVE"
    ).count()

    # Günlük/Haftalık/Aylık sepetler
    carts_today = db.query(models.CustomerCart).filter(
        models.CustomerCart.created_at >= today_start
    ).count()
    carts_week = db.query(models.CustomerCart).filter(
        models.CustomerCart.created_at >= week_start
    ).count()
    carts_month = db.query(models.CustomerCart).filter(
        models.CustomerCart.created_at >= month_start
    ).count()

    # Dönüşüm oranı (sepetteki ürünlerden satılanlar)
    total_cart_items = db.query(models.CartItem).count()
    sold_cart_items = db.query(models.CartItem).filter(
        models.CartItem.is_sold == True
    ).count()
    conversion_rate = round((sold_cart_items / max(1, total_cart_items)) * 100, 1)

    # Ortalama sepet tutarı
    avg_value = db.query(func.avg(models.CustomerCart.total_payable_amount)).filter(
        models.CustomerCart.status != "ACTIVE"
    ).scalar() or 0

    # Ortalama servis süresi
    avg_duration = db.query(func.avg(models.CustomerCart.duration_minutes)).filter(
        models.CustomerCart.duration_minutes > 0
    ).scalar() or 0

    # Sepet terk
    abandoned = db.query(models.CustomerCart).filter(
        models.CustomerCart.status == "ABANDONED"
    ).count()

    # Sepetten gelen ciro
    cart_revenue = db.query(func.sum(models.Sale.sale_price)).filter(
        models.Sale.invoice_no.like("SEP-%")
    ).scalar() or 0

    # En çok sepete eklenen ürünler
    top_products = db.query(
        models.CartItem.product_name,
        func.count(models.CartItem.id).label("count"),
        func.sum(models.CartItem.line_total).label("total")
    ).group_by(models.CartItem.product_name).order_by(desc("count")).limit(10).all()

    most_added = [
        {"product_name": p.product_name, "count": p.count, "total": round(p.total or 0, 2)}
        for p in top_products
    ]

    # Personel bazlı sepet performansı
    staff_perf = db.query(
        models.CustomerCart.user_name,
        func.count(models.CustomerCart.id).label("cart_count"),
        func.sum(models.CustomerCart.total_payable_amount).label("total_revenue"),
        func.avg(models.CustomerCart.duration_minutes).label("avg_duration")
    ).filter(
        models.CustomerCart.status != "ACTIVE"
    ).group_by(models.CustomerCart.user_name).order_by(desc("total_revenue")).all()

    staff_performance = [
        {
            "user_name": s.user_name or "Personel",
            "cart_count": s.cart_count,
            "total_revenue": round(s.total_revenue or 0, 2),
            "avg_duration": round(s.avg_duration or 0, 1)
        }
        for s in staff_perf
    ]

    # En çok talep edilen modeller
    top_demands = db.query(
        models.CustomerDemand.requested_model,
        func.count(models.CustomerDemand.id).label("count")
    ).group_by(models.CustomerDemand.requested_model).order_by(desc("count")).limit(10).all()

    top_demanded = [
        {"model": d.requested_model, "count": d.count}
        for d in top_demands
    ]

    # Bugün yapılacak hatırlatmalar
    active_reminders = db.query(models.CustomerReminder).filter(
        models.CustomerReminder.is_completed == False,
        models.CustomerReminder.reminder_date <= today_start + datetime.timedelta(days=1)
    ).count()

    # Kaçırılan fırsatlar (sepete eklendi ama satılmadı)
    missed = db.query(
        models.CartItem.product_name,
        func.count(models.CartItem.id).label("count"),
        func.sum(models.CartItem.line_total).label("potential_revenue")
    ).filter(
        models.CartItem.is_sold == False,
        models.CartItem.cart_id.in_(
            db.query(models.CustomerCart.id).filter(models.CustomerCart.status == "CLOSED").subquery()
        )
    ).group_by(models.CartItem.product_name).order_by(desc("potential_revenue")).limit(10).all()

    missed_opportunities = [
        {
            "product_name": m.product_name,
            "count": m.count,
            "potential_revenue": round(m.potential_revenue or 0, 2)
        }
        for m in missed
    ]

    return schemas.CartMetricsOut(
        total_active_carts=active_carts,
        total_carts_today=carts_today,
        total_carts_this_week=carts_week,
        total_carts_this_month=carts_month,
        conversion_rate=conversion_rate,
        average_cart_value=round(avg_value, 2),
        average_service_minutes=round(avg_duration, 1),
        total_abandoned_carts=abandoned,
        total_revenue_from_carts=round(cart_revenue, 2),
        most_added_products=most_added,
        staff_cart_performance=staff_performance,
        top_demanded_models=top_demanded,
        active_reminders_today=active_reminders,
        missed_opportunities=missed_opportunities
    )


@router.get("/analytics/customer-interest", response_model=schemas.CustomerInterestReport)
def get_customer_interest_report(
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Müşteri ilgi haritası - Hangi ürünlere bakıldı, beğenildi, fiyat bulundu"""
    now = datetime.datetime.utcnow()
    month_start = now - datetime.timedelta(days=30)

    # Toplam müşteri
    total_customers = db.query(models.CustomerCart).filter(
        models.CustomerCart.created_at >= month_start,
        models.CustomerCart.customer_id.isnot(None)
    ).distinct(models.CustomerCart.customer_id).count()

    # Toplam gösterilen ürün
    total_shown = db.query(models.CartItem).filter(
        models.CartItem.created_at >= month_start,
        models.CartItem.was_shown_to_customer == True
    ).count()

    # Toplam inceleme süresi
    total_inspection = db.query(func.sum(models.CartItem.inspection_seconds)).filter(
        models.CartItem.created_at >= month_start
    ).scalar() or 0

    # Beğenilen ürünler
    liked = db.query(
        models.CartItem.product_name,
        func.count(models.CartItem.id).label("count")
    ).filter(
        models.CartItem.customer_reaction == "BEGENDI",
        models.CartItem.created_at >= month_start
    ).group_by(models.CartItem.product_name).order_by(desc("count")).limit(10).all()

    # Fiyat yüksek bulanlar
    price_sensitive = db.query(
        models.CartItem.product_name,
        func.count(models.CartItem.id).label("count")
    ).filter(
        models.CartItem.customer_reaction == "FIYAT_YUKSEK",
        models.CartItem.created_at >= month_start
    ).group_by(models.CartItem.product_name).order_by(desc("count")).limit(10).all()

    # Kararsız
    undecided = db.query(
        models.CartItem.product_name,
        func.count(models.CartItem.id).label("count")
    ).filter(
        models.CartItem.customer_reaction == "KARARSIZ",
        models.CartItem.created_at >= month_start
    ).group_by(models.CartItem.product_name).order_by(desc("count")).limit(10).all()

    # Kategori bazlı ilgi
    cat_interest = db.query(
        models.CartItem.category,
        func.count(models.CartItem.id).label("count"),
        func.sum(models.CartItem.inspection_seconds).label("total_seconds")
    ).filter(
        models.CartItem.created_at >= month_start
    ).group_by(models.CartItem.category).order_by(desc("count")).all()

    return schemas.CustomerInterestReport(
        total_customers_served=total_customers,
        total_products_shown=total_shown,
        total_inspection_minutes=round(total_inspection / 60.0, 1),
        liked_products=[{"name": l.product_name, "count": l.count} for l in liked],
        price_sensitive_products=[{"name": p.product_name, "count": p.count} for p in price_sensitive],
        undecided_products=[{"name": u.product_name, "count": u.count} for u in undecided],
        top_categories_by_interest=[
            {"category": c.category, "count": c.count, "total_minutes": round((c.total_seconds or 0) / 60.0, 1)}
            for c in cat_interest
        ]
    )
# Static paths must win over /{cart_id}.
router.routes.sort(key=lambda route: ("{" in route.path, -len(route.path)))
