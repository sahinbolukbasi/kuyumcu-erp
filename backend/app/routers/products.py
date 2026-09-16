import os
import shutil
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/v1/products", tags=["Products"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=List[schemas.ProductOut])
def list_products(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)
    if branch_id and branch_id > 0:
        query = query.filter(models.Product.branch_id == branch_id)
    if category:
        query = query.filter(models.Product.category == category)
    if status:
        query = query.filter(models.Product.status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Product.name.ilike(search_pattern)) |
            (models.Product.barcode.ilike(search_pattern))
        )
    return query.order_by(models.Product.id.desc()).all()


@router.post("", response_model=schemas.ProductOut)
def create_product(
    product_in: schemas.ProductCreate,
    admin: models.User = Depends(auth.require_admin), # Sadece Admin ürün ekleyebilir
    db: Session = Depends(get_db)
):
    existing = db.query(models.Product).filter(models.Product.barcode == product_in.barcode).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu barkod ile kayıtlı ürün zaten var.")

    prod_data = product_in.model_dump(exclude={"slot_id"})
    product = models.Product(**prod_data)
    db.add(product)
    db.commit()
    db.refresh(product)

    if product_in.slot_id:
        slot = db.query(models.RackSlot).filter(models.RackSlot.id == product_in.slot_id).first()
        if slot:
            slot.product_id = product.id
            slot.expected_weight = product.weight_grams
            slot.current_weight = product.weight_grams
            slot.status = "NORMAL"
            product.status = "Vitrinde"
            db.commit()
            db.refresh(product)

    return product


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return product


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    update_data: schemas.ProductUpdate,
    admin: models.User = Depends(auth.require_admin), # Sadece Admin düzenleyebilir
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    update_dict = update_data.model_dump(exclude_unset=True, exclude={"slot_id"})
    for key, value in update_dict.items():
        setattr(product, key, value)

    if "weight_grams" in update_dict and product.slot:
        product.slot.expected_weight = product.weight_grams

    if update_data.slot_id is not None:
        if product.slot:
            product.slot.product_id = None
            product.slot.expected_weight = 0.0
            product.slot.status = "EMPTY"
        if update_data.slot_id > 0:
            new_slot = db.query(models.RackSlot).filter(models.RackSlot.id == update_data.slot_id).first()
            if new_slot:
                new_slot.product_id = product.id
                new_slot.expected_weight = product.weight_grams
                new_slot.current_weight = product.weight_grams
                new_slot.status = "NORMAL"
                product.status = "Vitrinde"

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    admin: models.User = Depends(auth.require_admin), # Sadece Admin silebilir
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    if product.slot:
        product.slot.product_id = None
        product.slot.expected_weight = 0.0
        product.slot.status = "EMPTY"

    db.delete(product)
    db.commit()
    return {"message": "Ürün başarıyla silindi"}


@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    admin: models.User = Depends(auth.require_admin)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".avif"]:
        raise HTTPException(status_code=400, detail="Sadece resim dosyaları desteklenir (.jpg, .png, .webp)")

    filename = f"prod_{uuid.uuid4().hex[:10]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"image_url": f"/uploads/{filename}"}


@router.get("/{product_id}/presentation", response_model=schemas.ProductDetailPresentationOut)
def get_product_presentation(
    product_id: int,
    gold_rate: Optional[float] = Query(3045.0, description="Güncel Has Altın Kuru"),
    db: Session = Depends(get_db)
):
    """Müşteriye lüks vitrinde veya tablette sunulacak VIP Mücevher Hikaye ve Şeffaf Fiyat Ekranı"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    # Has katsayısı
    purity_factors = {"24K": 1.000, "22K": 0.916, "18K": 0.750, "14K": 0.585, "8K": 0.333}
    factor = purity_factors.get(product.purity.upper(), 0.916)
    has_grams = round(product.weight_grams * factor, 3)
    has_value_tl = round(has_grams * gold_rate, 2)

    labor_tl = round(product.labor_cost if product.labor_cost > 0 else (product.price * 0.08), 2)
    stone_tl = round(max(0.0, product.price - has_value_tl - labor_tl), 2)
    
    # 3065 S.K. 17/4-g KDV Hesabı (Has istisna, işçilik %20 KDV)
    labor_vat = round(labor_tl - (labor_tl / 1.20), 2)

    # Taksit Seçenekleri
    price = product.price
    installment_plans = [
        schemas.InstallmentPlan(installment_count=1, monthly_amount=price, total_amount=price, description="Peşin / Tek Çekim"),
        schemas.InstallmentPlan(installment_count=3, monthly_amount=round(price / 3, 2), total_amount=price, description="Vade Farksız 3 Taksit"),
        schemas.InstallmentPlan(installment_count=6, monthly_amount=round((price * 1.04) / 6, 2), total_amount=round(price * 1.04, 2), description="Avantajlı 6 Taksit (%4 vade)"),
        schemas.InstallmentPlan(installment_count=9, monthly_amount=round((price * 1.08) / 9, 2), total_amount=round(price * 1.08, 2), description="Maksimum 9 Taksit (%8 vade)"),
    ]

    # Çapraz Satış Önerileri
    cross_sell_items = []
    if product.cross_sell_category:
        cross_sell_items = db.query(models.Product).filter(
            models.Product.category == product.cross_sell_category,
            models.Product.id != product.id,
            models.Product.status == "Vitrinde"
        ).limit(3).all()

    qr_url = f"https://sarraferdem.com/urun/{product.barcode}"

    return schemas.ProductDetailPresentationOut(
        product=product,
        has_gold_grams=has_grams,
        current_gold_rate=gold_rate,
        has_gold_value_tl=has_value_tl,
        labor_cost_tl=labor_tl,
        stone_value_tl=stone_tl,
        total_price_tl=product.price,
        vat_exempt_amount=has_value_tl,
        calculated_vat=labor_vat,
        installment_plans=installment_plans,
        qr_share_url=qr_url,
        cross_sell_recommendations=cross_sell_items
    )


@router.post("/bulk-csv-import")
async def bulk_import_csv(
    file: UploadFile = File(...),
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Excel / CSV dosyasından toplu ürün içeri aktarma"""
    contents = await file.read()
    text = contents.decode("utf-8", errors="ignore")
    lines = text.strip().split("\n")
    if len(lines) < 2:
        raise HTTPException(status_code=400, detail="Dosya boş veya başlık satırı eksik")

    added_count = 0
    header = [h.strip().lower() for h in lines[0].split(",")]

    for line in lines[1:]:
        parts = [p.strip().replace('"', '') for p in line.split(",")]
        if len(parts) < 4:
            continue
        try:
            barcode = parts[0]
            name = parts[1]
            category = parts[2] if len(parts) > 2 else "Bilezik"
            purity = parts[3] if len(parts) > 3 else "22K"
            weight = float(parts[4]) if len(parts) > 4 else 10.0
            price = float(parts[5]) if len(parts) > 5 else 30000.0

            # Mevcut mu?
            existing = db.query(models.Product).filter(models.Product.barcode == barcode).first()
            if not existing:
                new_prod = models.Product(
                    barcode=barcode,
                    name=name,
                    category=category,
                    purity=purity,
                    weight_grams=weight,
                    price=price,
                    gold_color="Sarı Altın",
                    milyem=916 if purity == "22K" else (750 if purity == "18K" else 585),
                    craftsmanship_type="El İşçiliği",
                    status="Vitrinde",
                    cost_price=round(price * 0.82, 2)
                )
                db.add(new_prod)
                added_count += 1
        except Exception:
            continue

    db.commit()
    return {"message": f"{added_count} adet ürün başarıyla sisteme aktarıldı."}


# ================= VARYANT YÖNETİMİ =================
@router.post("/{product_id}/variants", response_model=schemas.ProductVariantOut)
def add_product_variant(
    product_id: int,
    variant_in: schemas.ProductVariantCreate,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Bir ürüne renk / boy / ölçü varyantı ekleme (PRD Modül 2)"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ana ürün bulunamadı")

    barcode = variant_in.variant_barcode or f"{product.barcode}-{variant_in.color[:2].upper()}-{variant_in.size_or_length[:3].upper()}"
    
    # Barkod çakışma kontrolü
    existing_var = db.query(models.ProductVariant).filter(models.ProductVariant.variant_barcode == barcode).first()
    if existing_var:
        barcode = f"{barcode}-{uuid.uuid4().hex[:4].upper()}"

    variant = models.ProductVariant(
        product_id=product_id,
        color=variant_in.color,
        size_or_length=variant_in.size_or_length,
        variant_barcode=barcode,
        weight_grams=variant_in.weight_grams,
        additional_labor=variant_in.additional_labor,
        stock_quantity=variant_in.stock_quantity,
        image_url=variant_in.image_url or product.image_url
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


@router.get("/{product_id}/variants", response_model=List[schemas.ProductVariantOut])
def list_product_variants(product_id: int, db: Session = Depends(get_db)):
    """Ürünün tüm renk ve boy varyantlarını listele"""
    return db.query(models.ProductVariant).filter(models.ProductVariant.product_id == product_id).all()


@router.delete("/variants/{variant_id}")
def delete_product_variant(
    variant_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=404, detail="Varyant bulunamadı")
    db.delete(variant)
    db.commit()
    return {"message": "Varyant başarıyla silindi"}


# ================= RESMİ MÜCEVHER GARANTİ SERTİFİKASI =================
@router.get("/{product_id}/certificate", response_model=schemas.JewelryCertificateOut)
def generate_product_certificate(product_id: int, db: Session = Depends(get_db)):
    """PRD Modül 7: QR kodlu, Darphane & Sarraf Erdem Garantili Mücevher Sertifikası"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    store_name = product.branch.name if product.branch else "Sarraf Erdem Genel Merkez"
    store_addr = product.branch.address if product.branch else "Kapalıçarşı Kalpakçılar Cad. No:42, Fatih / İstanbul"
    cert_no = product.certificate_no or f"SE-{datetime.datetime.utcnow().year}-{product.id:05d}"
    issue_date = datetime.datetime.utcnow().strftime("%d.%m.%Y %H:%M")

    qr_payload = f"SARRAF_ERDEM_CERT|NO:{cert_no}|PROD:{product.name}|PURITY:{product.purity}|GRAM:{product.weight_grams}g|BARCODE:{product.barcode}"

    return schemas.JewelryCertificateOut(
        certificate_no=cert_no,
        issue_date=issue_date,
        store_name=store_name,
        store_address=store_addr,
        product_name=product.name,
        category=product.category,
        purity=product.purity,
        weight_grams=product.weight_grams,
        milyem=product.milyem or 916,
        gold_color=product.gold_color or "Sarı Altın",
        craftsmanship_type=product.craftsmanship_type or "Geleneksel El İşçiliği",
        has_stones=product.has_stones or False,
        diamond_carat=product.diamond_carat,
        diamond_color=product.diamond_color,
        diamond_clarity=product.diamond_clarity,
        diamond_cut=product.diamond_cut,
        stone_shape=product.stone_shape,
        gemstone_type=product.gemstone_type,
        qr_code_data=qr_payload,
        guarantee_terms="Bu mücevher, Sarraf Erdem Haute Joaillerie kalite ve ayar güvencesi altındadır. Uluslararası Darphane ve Kuyumcular Odası standartlarına uygundur. Ömür boyu ücretsiz bakım, rodaj ve taş tırnak kontrolü dahildir.",
        approved_by="Baş Usta & Şirket Yetkilisi"
    )

