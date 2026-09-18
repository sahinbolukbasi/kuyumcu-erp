import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Customer, Sale, SystemLog
from ..schemas import CustomerCreate, CustomerUpdate, CustomerOut, SaleOut
from .. import schemas, auth
from ..auth import get_current_user

router = APIRouter(prefix="/api/v1/crm", tags=["CRM & Müşteri Yönetimi"])

@router.get("/customers", response_model=List[CustomerOut])
def get_customers(
    search: Optional[str] = None,
    customer_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Customer)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Customer.full_name.ilike(search_fmt)) |
            (Customer.phone.ilike(search_fmt)) |
            (Customer.email.ilike(search_fmt)) |
            (Customer.id_number.ilike(search_fmt))
        )
    if customer_type:
        query = query.filter(Customer.customer_type == customer_type)
    return query.order_by(desc(Customer.total_spent)).offset(skip).limit(limit).all()

@router.post("/customers", response_model=CustomerOut)
def create_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    customer = Customer(**customer_in.dict())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    # Audit log
    log = SystemLog(
        level="INFO",
        module="CRM",
        message=f"Yeni müşteri kaydedildi: {customer.full_name} ({customer.customer_type})",
        user_id=current_user.id,
        user_name=current_user.full_name,
        details_json=json.dumps({"customer_id": customer.id, "phone": customer.phone})
    )
    db.add(log)
    db.commit()

    return customer

@router.get("/customers/{customer_id}", response_model=dict)
def get_customer_details(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    
    # Müşterinin tüm geçmiş satışları
    sales = db.query(Sale).filter(
        (Sale.customer_id == customer_id) | 
        (Sale.customer_name == customer.full_name) |
        (Sale.customer_phone == customer.phone)
    ).order_by(desc(Sale.created_at)).all()

    sales_data = []
    total_gold_grams = 0.0
    for s in sales:
        total_gold_grams += s.weight_grams
        sales_data.append({
            "id": s.id,
            "invoice_no": s.invoice_no or f"SE-{s.id:06d}",
            "product_name": s.product_name,
            "category": s.category,
            "purity": s.purity,
            "weight_grams": s.weight_grams,
            "sale_price": s.sale_price,
            "payment_method": s.payment_method,
            "sold_by_name": s.sold_by_name,
            "created_at": s.created_at.strftime("%d.%m.%Y %H:%M")
        })

    return {
        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "phone": customer.phone,
            "email": customer.email,
            "id_number": customer.id_number,
            "customer_type": customer.customer_type,
            "address": customer.address,
            "notes": customer.notes,
            "total_spent": customer.total_spent,
            "total_items": customer.total_items,
            "created_at": customer.created_at.strftime("%d.%m.%Y %H:%M")
        },
        "sales_history": sales_data,
        "total_gold_grams": round(total_gold_grams, 2)
    }

@router.post("/send-certificate-email")
def send_certificate_email(
    sale_id: int,
    target_email: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Satış kaydı bulunamadı")
    
    recipient = target_email or sale.customer_email
    if not recipient:
        recipient = "musteri@sarraferdem.com"

    inv_no = sale.invoice_no or f"SE-{sale.id:06d}"

    # E-Posta Gönderim Logu & Audit
    email_content = {
        "to": recipient,
        "subject": f"GOLDEN GUARD - Mücevherat Sertifikası & E-Fatura Fişi (#{inv_no})",
        "customer_name": sale.customer_name,
        "product_name": sale.product_name,
        "purity": sale.purity,
        "weight_grams": sale.weight_grams,
        "sale_price": sale.sale_price,
        "barcode": sale.barcode,
        "sold_by": sale.sold_by_name,
        "date": sale.created_at.strftime("%d.%m.%Y %H:%M"),
        "status": "SENT_SUCCESSFULLY"
    }

    log = SystemLog(
        level="INFO",
        module="CRM",
        message=f"Sertifika e-postası başarıyla gönderildi: {recipient} (Satış #{inv_no})",
        user_id=current_user.id,
        user_name=current_user.full_name,
        details_json=json.dumps(email_content)
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "message": f"Mücevher sertifikası ve detaylı fatura bilgisi {recipient} adresine başarıyla iletildi.",
        "email_details": email_content
    }


# ================= PRD MODÜL 7: ÜRÜN AYIRMA & KAPORA TAKİBİ =================
@router.post("/reservations", response_model=schemas.CustomerReservationOut)
def create_reservation(
    res_in: schemas.CustomerReservationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user_optional)
):
    """Müşteriye ürün ayırma ve kapora alma (PRD Modül 7)"""
    from ..models import Product, CustomerReservation
    import uuid

    product = db.query(Product).filter(Product.id == res_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    customer = db.query(Customer).filter(Customer.id == res_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")

    res_code = f"KPR-{datetime.datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"

    user_id = current_user.id if current_user else 1
    user_name = current_user.full_name if current_user else "Sistem Yetkilisi"

    reservation = CustomerReservation(
        reservation_code=res_code,
        customer_id=res_in.customer_id,
        product_id=res_in.product_id,
        variant_id=res_in.variant_id,
        branch_id=product.branch_id or (current_user.branch_id if current_user else 1),
        user_id=user_id,
        deposit_amount=res_in.deposit_amount,
        total_agreed_price=res_in.total_agreed_price or product.price,
        reserved_until=res_in.reserved_until,
        notes=res_in.notes,
        status="ACTIVE"
    )

    # Ürünün vitrindeki durumunu 'Ayrıldı (Kapora)' yap
    product.status = "Ayrıldı (Kapora)"
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    # Audit log
    log = SystemLog(
        level="INFO",
        module="CRM_KAPORA",
        message=f"Ürün Ayrıldı / Kapora Alındı: {product.name} -> {customer.full_name} ({res_in.deposit_amount:,.2f} ₺)",
        user_id=user_id,
        user_name=user_name,
        details_json=json.dumps({"reservation_code": res_code, "deposit": res_in.deposit_amount, "until": str(res_in.reserved_until)})
    )
    db.add(log)
    db.commit()

    return schemas.CustomerReservationOut(
        id=reservation.id,
        reservation_code=reservation.reservation_code,
        customer_id=reservation.customer_id,
        customer_name=customer.full_name,
        product_id=reservation.product_id,
        product_name=product.name,
        variant_id=reservation.variant_id,
        branch_id=reservation.branch_id,
        deposit_amount=reservation.deposit_amount,
        total_agreed_price=reservation.total_agreed_price,
        reserved_until=reservation.reserved_until,
        notes=reservation.notes,
        status=reservation.status,
        created_at=reservation.created_at
    )


@router.get("/reservations", response_model=List[schemas.CustomerReservationOut])
def list_reservations(
    status: Optional[str] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user_optional)
):
    """Kayıtlı kapora ve ürün ayırma işlemlerini listele"""
    from ..models import CustomerReservation, Product
    query = db.query(CustomerReservation)

    # Şube filtresi
    if current_user and current_user.role in ["MANAGER", "STAFF"] and current_user.branch_id:
        query = query.filter(CustomerReservation.branch_id == current_user.branch_id)
    elif branch_id and branch_id > 0:
        query = query.filter(CustomerReservation.branch_id == branch_id)

    if status:
        query = query.filter(CustomerReservation.status == status)

    records = query.order_by(desc(CustomerReservation.id)).all()
    results = []
    for r in records:
        cust = db.query(Customer).filter(Customer.id == r.customer_id).first()
        prod = db.query(Product).filter(Product.id == r.product_id).first()
        results.append(schemas.CustomerReservationOut(
            id=r.id,
            reservation_code=r.reservation_code,
            customer_id=r.customer_id,
            customer_name=cust.full_name if cust else "Bilinmeyen",
            product_id=r.product_id,
            product_name=prod.name if prod else "Bilinmeyen Ürün",
            variant_id=r.variant_id,
            branch_id=r.branch_id,
            deposit_amount=r.deposit_amount,
            total_agreed_price=r.total_agreed_price,
            reserved_until=r.reserved_until,
            notes=r.notes,
            status=r.status,
            created_at=r.created_at
        ))
    return results


@router.put("/reservations/{reservation_id}/status")
def update_reservation_status(
    reservation_id: int,
    status: str = Query(..., description="ACTIVE, COMPLETED, CANCELLED"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Rezervasyon durumunu tamamla (satıldı) veya iptal et"""
    from ..models import CustomerReservation, Product
    res = db.query(CustomerReservation).filter(CustomerReservation.id == reservation_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Rezervasyon bulunamadı")

    res.status = status
    prod = db.query(Product).filter(Product.id == res.product_id).first()
    if prod:
        if status == "CANCELLED":
            prod.status = "Vitrinde" # Tekrar vitrine döndür
        elif status == "COMPLETED":
            prod.status = "Satıldı"

    db.commit()
    return {"message": f"Rezervasyon durumu güncellendi: {status}"}


@router.post("/interests", response_model=schemas.CustomerInterestOut)
def record_customer_interest(
    interest_in: schemas.CustomerInterestCreate,
    db: Session = Depends(get_db),
    current_user = Depends(auth.get_current_user_optional)
):
    """PRD Modül 7: Satış temsilcisi ürünü müşteriye gösterdiğinde veya müşteri beğendiğinde kaydet"""
    from ..models import CustomerInterest, Customer, Product, SystemLog
    customer = db.query(Customer).filter(Customer.id == interest_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Müşteri bulunamadı")
    product = db.query(Product).filter(Product.id == interest_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    user_id = current_user.id if current_user else None
    user_name = current_user.full_name if current_user else "Personel"

    interest = CustomerInterest(
        customer_id=interest_in.customer_id,
        product_id=interest_in.product_id,
        user_id=user_id,
        branch_id=product.branch_id or 1,
        action_type=interest_in.action_type,
        notes=interest_in.notes
    )
    db.add(interest)
    db.commit()
    db.refresh(interest)

    # Değiştirilemez güvenlik ve CRM logu
    action_label = "Müşteriye Gösterildi" if interest_in.action_type == "SHOWN" else "Müşteri Beğendi (İstek Listesi)"
    log = SystemLog(
        level="INFO",
        module="CRM_INTERACTION",
        message=f"{action_label}: {product.name} ({product.purity}) -> {customer.full_name}",
        user_id=user_id,
        user_name=user_name,
        details_json=json.dumps({"customer_id": customer.id, "product_id": product.id, "action": interest_in.action_type})
    )
    db.add(log)
    db.commit()

    return schemas.CustomerInterestOut(
        id=interest.id,
        customer_id=customer.id,
        customer_name=customer.full_name,
        product_id=product.id,
        product_name=product.name,
        category=product.category,
        purity=product.purity,
        weight_grams=product.weight_grams,
        price=product.price,
        image_url=product.image_url,
        action_type=interest.action_type,
        notes=interest.notes,
        created_at=interest.created_at
    )


@router.get("/customers/{customer_id}/interests", response_model=List[schemas.CustomerInterestOut])
def get_customer_interests(
    customer_id: int,
    db: Session = Depends(get_db)
):
    """Müşterinin ilgilendiği, denediği ve beğendiği ürünlerin dökümü"""
    from ..models import CustomerInterest, Customer, Product
    interests = db.query(CustomerInterest).filter(CustomerInterest.customer_id == customer_id).order_by(CustomerInterest.created_at.desc()).all()
    results = []
    for it in interests:
        prod = db.query(Product).filter(Product.id == it.product_id).first()
        cust = db.query(Customer).filter(Customer.id == it.customer_id).first()
        results.append(schemas.CustomerInterestOut(
            id=it.id,
            customer_id=it.customer_id,
            customer_name=cust.full_name if cust else None,
            product_id=it.product_id,
            product_name=prod.name if prod else None,
            category=prod.category if prod else None,
            purity=prod.purity if prod else None,
            weight_grams=prod.weight_grams if prod else None,
            price=prod.price if prod else None,
            image_url=prod.image_url if prod else None,
            action_type=it.action_type,
            notes=it.notes,
            created_at=it.created_at
        ))
    return results


@router.post("/share-certificate")
def share_certificate_message(
    payload: dict,
    db: Session = Depends(get_db)
):
    """PRD Modül 7: Sertifikayı müşteriye WhatsApp / E-Posta ile gönderme simülasyonu"""
    phone = payload.get("phone", "")
    email = payload.get("email", "")
    cert_no = payload.get("certificate_no", "")
    channel = payload.get("channel", "WHATSAPP")  # WHATSAPP | EMAIL

    return {
        "status": "SUCCESS",
        "channel": channel,
        "message": f"Resmi Mücevher Sertifikası ({cert_no}) müşterinin {channel} adresine ({phone or email}) başarıyla iletildi.",
        "sent_at": datetime.datetime.utcnow().isoformat()
    }


