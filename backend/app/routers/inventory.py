import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/v1/inventory", tags=["Gelişmiş Envanter, Has Sermaye & Sayım Mutabakatı"])

# Ayar Has Çarpanları
PURITY_FACTORS = {
    "24K": 1.000,
    "22K": 0.916,
    "18K": 0.750,
    "14K": 0.585,
}

@router.get("/capital-report", response_model=schemas.CapitalReportOut)
def get_capital_report(
    gold_rate: Optional[float] = Query(3045.0, description="Güncel Has Altın Fiyatı (TL/g)"),
    usd_rate: Optional[float] = Query(34.20, description="USD/TRY Kuru"),
    eur_rate: Optional[float] = Query(37.50, description="EUR/TRY Kuru"),
    db: Session = Depends(get_db)
):
    """Vitrindeki ve kasadaki altınların ayar bazında has altın gramı ve toplam sermaye değeri"""
    products = db.query(models.Product).filter(models.Product.status.in_(["Vitrinde", "Zimmette", "Kasada"])).all()

    breakdown_map = {
        "24K": {"purity": "24K (Has Altın)", "factor": 1.000, "count": 0, "gross": 0.0, "has": 0.0, "tl": 0.0},
        "22K": {"purity": "22K (Bilezik & Ziynet)", "factor": 0.916, "count": 0, "gross": 0.0, "has": 0.0, "tl": 0.0},
        "18K": {"purity": "18K (Pırlantalı Takı)", "factor": 0.750, "count": 0, "gross": 0.0, "has": 0.0, "tl": 0.0},
        "14K": {"purity": "14K (Modern Fantezi Takı)", "factor": 0.585, "count": 0, "gross": 0.0, "has": 0.0, "tl": 0.0},
    }

    total_gross = 0.0
    total_has = 0.0
    total_tl = 0.0
    showcase_tl = 0.0
    vault_tl = 0.0

    for p in products:
        purity_key = p.purity.upper() if p.purity else "22K"
        if purity_key not in breakdown_map:
            purity_key = "22K"

        factor = breakdown_map[purity_key]["factor"]
        has_grams = round(p.weight_grams * factor, 3)
        gold_value_tl = round(has_grams * gold_rate, 2)

        breakdown_map[purity_key]["count"] += 1
        breakdown_map[purity_key]["gross"] = round(breakdown_map[purity_key]["gross"] + p.weight_grams, 2)
        breakdown_map[purity_key]["has"] = round(breakdown_map[purity_key]["has"] + has_grams, 2)
        breakdown_map[purity_key]["tl"] = round(breakdown_map[purity_key]["tl"] + gold_value_tl, 2)

        total_gross += p.weight_grams
        total_has += has_grams
        total_tl += gold_value_tl

        if p.status in ["Vitrinde", "Zimmette"]:
            showcase_tl += gold_value_tl
        else:
            vault_tl += gold_value_tl

    purity_list = [
        schemas.PurityCapitalDetail(
            purity=v["purity"],
            purity_factor=v["factor"],
            piece_count=v["count"],
            gross_weight_grams=v["gross"],
            has_gold_grams=v["has"],
            capital_value_tl=v["tl"]
        )
        for v in breakdown_map.values()
    ]

    return schemas.CapitalReportOut(
        gold_rate_has=gold_rate,
        usd_try_rate=usd_rate,
        eur_try_rate=eur_rate,
        total_piece_count=len(products),
        total_gross_grams=round(total_gross, 2),
        total_has_grams=round(total_has, 2),
        total_capital_tl=round(total_tl, 2),
        total_capital_usd=round(total_tl / (usd_rate or 1.0), 2),
        total_capital_eur=round(total_tl / (eur_rate or 1.0), 2),
        purity_breakdown=purity_list,
        showcase_capital_tl=round(showcase_tl, 2),
        vault_capital_tl=round(vault_tl, 2)
    )


@router.get("/critical-stock", response_model=schemas.SupplierOrderDraftOut)
def get_critical_stock_and_supplier_draft(
    threshold: Optional[int] = Query(2, description="Kritik stok adedi eşiği"),
    db: Session = Depends(get_db)
):
    """Kritik seviyenin altına inen modeller ve tek tıkla toptancıya gönderilecek sipariş taslağı"""
    active_products = db.query(models.Product).filter(models.Product.status != "Satıldı").all()
    
    group_counts = {}
    for p in active_products:
        key = (p.category, p.name, p.purity)
        group_counts[key] = group_counts.get(key, 0) + 1

    critical_items = []
    whatsapp_lines = ["📢 *GOLDEN GUARD - TOPTAN / ATÖLYE SİPARİŞ LİSTESİ*", "Tarih: " + datetime.datetime.now().strftime("%d.%m.%Y %H:%M"), "---"]

    for p in active_products:
        key = (p.category, p.name, p.purity)
        current_cnt = group_counts.get(key, 1)
        min_limit = p.min_stock_alert or threshold

        if current_cnt <= min_limit and not any(ci.name == p.name for ci in critical_items):
            suggested_qty = max(3, (min_limit * 2) - current_cnt)
            crit = schemas.CriticalStockItem(
                product_id=p.id,
                name=p.name,
                category=p.category,
                purity=p.purity,
                barcode=p.barcode,
                current_stock=current_cnt,
                min_stock_alert=min_limit,
                suggested_order_qty=suggested_qty,
                supplier_note=f"Vitrinde yalnızca {current_cnt} adet kaldı. Asgari {suggested_qty} adet tedarik önerilir."
            )
            critical_items.append(crit)
            whatsapp_lines.append(f"• *{p.name}* ({p.purity} {p.category}) -> Kalan: {current_cnt} ad. | Sipariş: {suggested_qty} ad.")

    whatsapp_lines.append("---")
    whatsapp_lines.append("Lütfen termin ve işçilik maliyetiyle birlikte teyit ediniz.")

    return schemas.SupplierOrderDraftOut(
        generated_at=datetime.datetime.now().strftime("%d.%m.%Y %H:%M"),
        total_items_to_order=len(critical_items),
        suggested_products=critical_items,
        whatsapp_draft_text="\n".join(whatsapp_lines)
    )


@router.get("/stagnant-stock", response_model=List[schemas.StagnantStockItem])
def get_stagnant_stock_report(
    min_days: Optional[int] = Query(30, description="Minimum vitrinde kalma günü"),
    db: Session = Depends(get_db)
):
    """Ürün yaşam döngüsü & Durgun Stok Raporu (Çok denendiği halde satılmayanlar)"""
    products = db.query(models.Product).filter(models.Product.status == "Vitrinde").all()
    now = datetime.datetime.utcnow()

    results = []
    for p in products:
        days = (now - p.created_at).days if p.created_at else 45
        view_cnt = p.view_count or 0
        
        if days >= 60 and view_cnt >= 15:
            score = "KRİTİK DURGUN"
            rec = "Müşteri yüksek ilgi gösterdi fakat almadı. %5-10 işçilik indirimi veya vitrin değişikliği önerilir."
        elif days >= 45:
            score = "ORTA DURGUN"
            rec = "Vitrin ön sırasına veya aydınlık ana tablaya taşıyınız."
        else:
            score = "NORMAL"
            rec = "Standart sergilemeye devam ediniz."

        results.append(schemas.StagnantStockItem(
            product_id=p.id,
            barcode=p.barcode,
            name=p.name,
            category=p.category,
            purity=p.purity,
            weight_grams=p.weight_grams,
            price=p.price,
            days_in_showcase=days,
            view_count=view_cnt,
            total_inspection_seconds=p.total_inspection_seconds or 0,
            stagnant_score=score,
            recommendation=rec
        ))

    results.sort(key=lambda x: (x.stagnant_score == "KRİTİK DURGUN", x.days_in_showcase), reverse=True)
    return results


# --- BARKOD / RFID HIZLI SAYIM & MUTABAKAT ---
@router.post("/audit/start", response_model=schemas.StockAuditOut)
def start_stock_audit(
    payload: schemas.StockAuditCreate,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Yeni bir hızlı sayım oturumu başlatır"""
    conducted_name = current_user.full_name if current_user else "Yetkili Personel"
    user_id = current_user.id if current_user else 1

    audit = models.StockCountAudit(
        title=payload.title or "Aylık Vitrin Sayımı",
        branch_id=payload.branch_id or 1,
        conducted_by_user_id=user_id,
        conducted_by_name=conducted_name,
        status="IN_PROGRESS",
        matched_count=0,
        missing_count=0,
        surplus_count=0,
        notes=payload.notes
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit


@router.post("/audit/{audit_id}/scan", response_model=schemas.StockCountItemOut)
def scan_barcode_for_audit(
    audit_id: int,
    payload: schemas.StockAuditScanRequest,
    db: Session = Depends(get_db)
):
    """El terminali / barkod okuyucuyla ürün okutma"""
    audit = db.query(models.StockCountAudit).filter(models.StockCountAudit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Sayım oturumu bulunamadı")

    barcode_clean = payload.barcode.strip().upper()
    product = db.query(models.Product).filter(models.Product.barcode == barcode_clean).first()

    status = "MATCHED" if product else "SURPLUS"
    expected_slot = f"Askı #{product.slot.slot_number}" if (product and product.slot) else "Bilinmiyor"

    item = models.StockCountItem(
        audit_id=audit.id,
        product_id=product.id if product else None,
        barcode=barcode_clean,
        product_name=product.name if product else "Tanımsız / Fazla Ürün",
        category=product.category if product else "Diğer",
        weight_grams=product.weight_grams if product else 0.0,
        expected_slot=expected_slot,
        status=status,
        scanned_at=datetime.datetime.utcnow()
    )
    db.add(item)
    
    if status == "MATCHED":
        audit.matched_count += 1
    else:
        audit.surplus_count += 1

    db.commit()
    db.refresh(item)
    return item


@router.post("/audit/{audit_id}/finish", response_model=schemas.StockAuditOut)
def finish_stock_audit(
    audit_id: int,
    db: Session = Depends(get_db)
):
    """Sayımı tamamlar, okutulmayan eksik ürünleri tespit eder ve mutabakat raporunu kapatır"""
    audit = db.query(models.StockCountAudit).filter(models.StockCountAudit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Sayım oturumu bulunamadı")

    scanned_barcodes = {item.barcode for item in audit.items}

    showcase_products = db.query(models.Product).filter(
        models.Product.status.in_(["Vitrinde", "Zimmette"]),
        models.Product.branch_id == audit.branch_id
    ).all()

    missing_cnt = 0
    for p in showcase_products:
        if p.barcode not in scanned_barcodes:
            missing_item = models.StockCountItem(
                audit_id=audit.id,
                product_id=p.id,
                barcode=p.barcode,
                product_name=p.name,
                category=p.category,
                weight_grams=p.weight_grams,
                expected_slot=f"Askı #{p.slot.slot_number}" if p.slot else "Vitrin",
                status="MISSING",
                scanned_at=datetime.datetime.utcnow()
            )
            db.add(missing_item)
            missing_cnt += 1

    audit.missing_count = missing_cnt
    audit.status = "COMPLETED"
    audit.completed_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(audit)
    return audit


@router.get("/audit/history", response_model=List[schemas.StockAuditOut])
def get_audit_history(db: Session = Depends(get_db)):
    """Geçmiş sayım raporlarını getirir"""
    audits = db.query(models.StockCountAudit).order_by(desc(models.StockCountAudit.created_at)).limit(10).all()
    return audits
