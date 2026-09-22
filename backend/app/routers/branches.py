import datetime
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/v1/branches", tags=["Çoklu Şube, Muhasebe Entegrasyonu & Kâr Analitiği"])


@router.get("", response_model=List[schemas.BranchOut])
def list_branches(
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Aktif kuyumcu şubeleri (Firma İzolasyonlu)"""
    query = db.query(models.Branch).filter(models.Branch.is_active == True)
    if current_user and hasattr(current_user, 'tenant_id') and current_user.tenant_id:
        query = query.filter(models.Branch.tenant_id == current_user.tenant_id)

    branches = query.all()
    if not branches and (not current_user or current_user.tenant_id == 1):
        # Varsayılan şubeler oluştur
        t_id = current_user.tenant_id if current_user and current_user.tenant_id else 1
        b1 = models.Branch(name="Kapalıçarşı Merkez Mağaza", city="İstanbul", address="Kapalıçarşı Kalpakçılar Cad. No:42, Fatih", phone="0212 522 10 20", tenant_id=t_id)
        b2 = models.Branch(name="Nişantaşı VIP Showroom", city="İstanbul", address="Abdi İpekçi Cad. No:18, Şişli", phone="0212 230 40 50", tenant_id=t_id)
        b3 = models.Branch(name="Bağdat Caddesi Şube", city="İstanbul", address="Bağdat Cad. No:312, Kadıköy", phone="0216 385 60 70", tenant_id=t_id)
        db.add_all([b1, b2, b3])
        db.commit()
        branches = [b1, b2, b3]
    return branches


@router.post("", response_model=schemas.BranchOut)
def create_branch(
    branch_in: schemas.BranchCreate,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Yeni mağaza / şube ekleme (Sadece Admin - PRD Modül 1)"""
    tenant_id = admin.tenant_id or 1
    license_obj = db.query(models.TenantLicense).filter(models.TenantLicense.tenant_id == tenant_id).first()
    branch_count = db.query(models.Branch).filter(models.Branch.tenant_id == tenant_id, models.Branch.is_active == True).count()
    if license_obj and branch_count >= license_obj.max_branches_count:
        raise HTTPException(status_code=403, detail="Firma şube kotası dolmuştur.")
    b = models.Branch(
        tenant_id=tenant_id,
        name=branch_in.name,
        branch_code=branch_in.branch_code or f"BR-{db.query(models.Branch).count() + 1:02d}",
        region=branch_in.region or "Marmara",
        city=branch_in.city or "İstanbul",
        address=branch_in.address,
        phone=branch_in.phone
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


# ================= PRD MODÜL 1: ŞUBE BAĞLI KONUM TANIMLARI =================
@router.post("/{branch_id}/locations")
def add_branch_location(
    branch_id: int,
    label: str = Query(..., description="Konum Etiketi örn: Bilezik Standı 1"),
    slot_type: str = Query("Askı", description="Askı, Tabla, Kasa"),
    group_name: str = Query("Ana Vitrin", description="Ana Vitrin, Çelik Kasa vb."),
    device_id: Optional[str] = Query("DEVICE_01"),
    ip_address: Optional[str] = Query("192.168.1.100"),
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """Mağazaya bağlı Kasa/Tabla/Askı konum tanımı oluşturma (PRD Modül 1 & 3)"""
    branch = db.query(models.Branch).filter(models.Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Mağaza bulunamadı")

    if branch.tenant_id != (admin.tenant_id or 1):
        raise HTTPException(status_code=403, detail="Bu mağazaya erişim yetkiniz yok.")
    auth.ensure_slot_quota(db, admin.tenant_id or 1)
    max_slot = db.query(models.RackSlot).order_by(models.RackSlot.slot_number.desc()).first()
    next_num = (max_slot.slot_number + 1) if max_slot else 1

    loc_code = f"{branch.branch_code or 'BR'}-{slot_type[:3].upper()}-{next_num:02d}"

    slot = models.RackSlot(
        slot_number=next_num,
        label=label,
        slot_type=slot_type,
        group_name=group_name,
        location_code=loc_code,
        device_id=device_id or "DEVICE_01",
        ip_address=ip_address or "192.168.1.100",
        branch_id=branch_id,
        is_online=True,
        status="EMPTY"
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return {
        "message": "Yeni fiziksel konum başarıyla oluşturuldu",
        "location": {
            "id": slot.id,
            "slot_number": slot.slot_number,
            "label": slot.label,
            "slot_type": slot.slot_type,
            "location_code": slot.location_code,
            "group_name": slot.group_name
        }
    }


@router.get("/{branch_id}/locations")
def list_branch_locations(branch_id: int, db: Session = Depends(get_db)):
    """Şubeye ait tüm fiziksel konumları (Kasa, Tabla, Askı) listele"""
    slots = db.query(models.RackSlot).filter(models.RackSlot.branch_id == branch_id).all()
    return [{
        "id": s.id,
        "slot_number": s.slot_number,
        "label": s.label,
        "slot_type": s.slot_type,
        "location_code": s.location_code or f"LOC-#{s.slot_number}",
        "group_name": s.group_name,
        "status": s.status,
        "current_weight": s.current_weight,
        "is_online": s.is_online,
        "products_count": len(s.products) if s.products else 0
    } for s in slots]



@router.get("/overview", response_model=schemas.BranchOverviewOut)
def get_branch_overview(
    branch_id: Optional[str] = None,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Seçilen mağazanın veya tüm şirketin (ALL) anlık özet metrikleri"""
    target_branch_id = None
    if branch_id and branch_id != "ALL":
        try:
            target_branch_id = int(branch_id)
        except (ValueError, TypeError):
            target_branch_id = None

    if current_user and current_user.role in ["MANAGER", "STAFF"]:
        target_branch_id = current_user.branch_id

    prod_query = db.query(models.Product)
    sale_query = db.query(models.Sale)
    staff_query = db.query(models.User).filter(models.User.is_active == True)
    alert_query = db.query(models.SecurityAlert).filter(models.SecurityAlert.is_resolved == False)

    branch_name = "Tüm Şirket (Konsolide Genel Merkez)"
    if target_branch_id and target_branch_id > 0:
        branch = db.query(models.Branch).filter(models.Branch.id == target_branch_id).first()
        if branch:
            branch_name = branch.name
        prod_query = prod_query.filter(models.Product.branch_id == target_branch_id)
        sale_query = sale_query.filter(models.Sale.branch_id == target_branch_id)
        staff_query = staff_query.filter(models.User.branch_id == target_branch_id)

    products = prod_query.all()
    sales = sale_query.all()

    total_sales_count = len(sales)
    total_sales_amount = sum(s.sale_price for s in sales)
    total_products_count = len(products)
    
    purity_factors = {"24K": 1.0, "22K": 0.916, "18K": 0.750, "14K": 0.585}
    total_has_grams = sum(p.weight_grams * purity_factors.get(p.purity, 0.916) for p in products)
    gold_rate_has = 3045.50
    total_capital_tl = total_has_grams * gold_rate_has

    staff_count = staff_query.count()
    active_alerts_count = alert_query.count()

    return schemas.BranchOverviewOut(
        branch_id=target_branch_id if target_branch_id and target_branch_id > 0 else None,
        branch_name=branch_name,
        total_sales_count=total_sales_count,
        total_sales_amount=round(total_sales_amount, 2),
        total_products_count=total_products_count,
        total_has_grams=round(total_has_grams, 3),
        total_capital_tl=round(total_capital_tl, 2),
        staff_count=staff_count,
        active_alerts_count=active_alerts_count
    )


@router.post("/transfer")
def transfer_stock_between_branches(
    payload: schemas.StockTransferRequest,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Şubeler arası stok transferi (Örn: Kapalıçarşı -> Nişantaşı)"""
    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    target_branch = db.query(models.Branch).filter(models.Branch.id == payload.target_branch_id).first()
    if not target_branch:
        raise HTTPException(status_code=404, detail="Hedef şube bulunamadı")

    old_branch_id = product.branch_id
    product.branch_id = target_branch.id
    
    # Vitrinden düşüp transfer/kasada statüsüne al
    if product.slot_id:
        slot = product.slot
        if slot:
            slot.expected_weight = max(0.0, round(slot.expected_weight - product.weight_grams, 2))
            slot.current_weight = slot.expected_weight
            slot.status = "NORMAL" if slot.expected_weight > 0 else "EMPTY"
        product.slot_id = None
        product.status = "Kasada"

    user_name = current_user.full_name if current_user else "Yetkili"
    log = models.SystemLog(
        level="INFO",
        module="INVENTORY",
        message=f"Şubeler Arası Transfer: {product.name} ({product.barcode}) -> {target_branch.name} şubesine sevk edildi. Not: {payload.notes or 'Yok'}",
        user_name=user_name
    )
    db.add(log)
    db.commit()

    return {
        "status": "success",
        "message": f"{product.name} başarıyla {target_branch.name} şubesine sevk edildi.",
        "product_id": product.id,
        "new_branch": target_branch.name
    }


@router.get("/analytics/hourly-traffic")
def get_hourly_traffic_heatmap(db: Session = Depends(get_db)):
    """Günün saatlerine göre müşteri yoğunluğu ve satış ısı haritası"""
    # 09:00 - 20:00 arası saatlik dağılım simülasyonu ve gerçek veriler
    sales = db.query(models.Sale).all()
    sessions = db.query(models.ServiceSession).all()

    hours_data = []
    for h in range(9, 21):
        hour_label = f"{h:02d}:00"
        # Gerçek saat eşleşmesi veya kuyumcu yoğunluk eğrisi
        sale_cnt = sum(1 for s in sales if s.created_at and s.created_at.hour == h)
        service_cnt = sum(1 for sess in sessions if sess.started_at and sess.started_at.hour == h)
        
        # Tipik Kapalıçarşı saatlik yoğunluk katsayısı
        typical_factor = 12 if 13 <= h <= 17 else (6 if 11 <= h <= 12 else 3)
        total_traffic = max(sale_cnt + service_cnt, typical_factor + (sale_cnt * 2))

        hours_data.append({
            "hour": hour_label,
            "traffic_count": total_traffic,
            "sales_count": sale_cnt,
            "intensity": "Yüksek" if total_traffic >= 10 else ("Orta" if total_traffic >= 5 else "Sakin")
        })

    return hours_data


@router.get("/analytics/profit-margin")
def get_profit_margin_analysis(db: Session = Depends(get_db)):
    """Gerçek zamanlı kâr marjı analizi (Alış Maliyeti vs Satış Fiyatı)"""
    sales = db.query(models.Sale).all()

    total_revenue = 0.0
    total_cost = 0.0

    category_margins = {}

    for s in sales:
        rev = s.sale_price or 0.0
        # Maliyet yoksa yaklaşık %82 altın maliyeti + işçilik baz al
        cost = s.cost_price if (s.cost_price and s.cost_price > 0) else round(rev * 0.82, 2)
        profit = round(rev - cost, 2)

        total_revenue += rev
        total_cost += cost

        cat = s.category or "Diğer"
        if cat not in category_margins:
            category_margins[cat] = {"revenue": 0.0, "cost": 0.0, "profit": 0.0, "count": 0}
        category_margins[cat]["revenue"] += rev
        category_margins[cat]["cost"] += cost
        category_margins[cat]["profit"] += profit
        category_margins[cat]["count"] += 1

    net_profit = round(total_revenue - total_cost, 2)
    overall_margin = round((net_profit / total_revenue * 100), 1) if total_revenue > 0 else 0.0

    cat_list = []
    for cat, data in category_margins.items():
        m = round((data["profit"] / data["revenue"] * 100), 1) if data["revenue"] > 0 else 0.0
        cat_list.append({
            "category": cat,
            "sales_count": data["count"],
            "revenue": round(data["revenue"], 2),
            "cost": round(data["cost"], 2),
            "net_profit": round(data["profit"], 2),
            "margin_percent": m
        })

    cat_list.sort(key=lambda x: x["net_profit"], reverse=True)

    return {
        "total_revenue": round(total_revenue, 2),
        "total_cost": round(total_cost, 2),
        "net_profit": net_profit,
        "overall_margin_percent": overall_margin,
        "category_breakdown": cat_list
    }


@router.get("/export/logo-netsis", response_model=schemas.LogoNetsisExportOut)
def export_sales_for_erp(
    format_type: Optional[str] = Query("LOGO_XML", description="LOGO_XML veya NETSIS_JSON"),
    db: Session = Depends(get_db)
):
    """Satış verilerini Logo Tiger / Netsis ERP muhasebe formatında dışa aktarma"""
    sales = db.query(models.Sale).order_by(desc(models.Sale.created_at)).limit(50).all()
    total_amount = sum(s.sale_price for s in sales)
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if format_type == "NETSIS_JSON":
        netsis_data = {
            "ENT_HEADER": {
                "SOURCE": "SARRAF_ERDEM_SHOWCASE_ERP",
                "EXPORT_DATE": now_str,
                "CURRENCY": "TRY",
                "DOCUMENT_COUNT": len(sales),
                "TOTAL_CREDIT": total_amount
            },
            "INVOICES": [
                {
                    "FATURA_NO": s.invoice_no or f"SE{s.id:06d}",
                    "TARIH": s.created_at.strftime("%Y-%m-%d") if s.created_at else now_str[:10],
                    "CARI_ISIM": s.customer_name,
                    "URUN_ADI": s.product_name,
                    "BARKOD": s.barcode or "KYM-000",
                    "MIKTAR": 1,
                    "BIRIM": "ADET",
                    "GRAM": s.weight_grams,
                    "HAS_KUR": s.gold_rate_at_sale,
                    "TUTAR": s.sale_price,
                    "KDV_ORANI": 0, # Has altın KDV istisna
                    "ODEME_TIPI": s.payment_method
                }
                for s in sales
            ]
        }
        raw_output = json.dumps(netsis_data, indent=2, ensure_ascii=False)
    else:
        # LOGO TIGER XML FORMAT
        xml_lines = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<SALES_INVOICES>',
            f'  <HEADER CREATED_AT="{now_str}" APP="SARRAF_ERDEM_ERP" TOTAL_INVOICES="{len(sales)}" TOTAL_SUM="{total_amount:.2f}"/>'
        ]
        for s in sales:
            inv_no = s.invoice_no or f"SE{s.id:06d}"
            d_str = s.created_at.strftime("%d.%m.%Y") if s.created_at else now_str[:10]
            xml_lines.append('  <INVOICE>')
            xml_lines.append(f'    <NUMBER>{inv_no}</NUMBER>')
            xml_lines.append(f'    <DATE>{d_str}</DATE>')
            xml_lines.append(f'    <CUSTOMER_TITLE>{s.customer_name}</CUSTOMER_TITLE>')
            xml_lines.append(f'    <ITEM_CODE>{s.barcode or "KYM"}</ITEM_CODE>')
            xml_lines.append(f'    <ITEM_NAME>{s.product_name}</ITEM_NAME>')
            xml_lines.append(f'    <PURITY>{s.purity}</PURITY>')
            xml_lines.append(f'    <WEIGHT_GRAMS>{s.weight_grams}</WEIGHT_GRAMS>')
            xml_lines.append(f'    <TOTAL_NET>{s.sale_price:.2f}</TOTAL_NET>')
            xml_lines.append(f'    <PAYMENT_TYPE>{s.payment_method}</PAYMENT_TYPE>')
            xml_lines.append('  </INVOICE>')
        xml_lines.append('</SALES_INVOICES>')
        raw_output = "\n".join(xml_lines)

    return schemas.LogoNetsisExportOut(
        export_format=format_type,
        generated_at=now_str,
        total_sales_count=len(sales),
        total_amount=round(total_amount, 2),
        raw_content=raw_output
    )
