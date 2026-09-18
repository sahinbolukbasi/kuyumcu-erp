import datetime
import json
import itertools
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from .. import models, schemas, iot_service, auth

router = APIRouter(prefix="/api/v1/iot", tags=["IoT, Tablalar & Askılar"])

@router.get("/slots", response_model=List[schemas.RackSlotOut])
def list_slots(
    group_name: Optional[str] = None,
    slot_type: Optional[str] = None,
    branch_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.RackSlot)
    if branch_id and branch_id > 0:
        query = query.filter(models.RackSlot.branch_id == branch_id)
    if group_name and group_name != "ALL":
        query = query.filter(models.RackSlot.group_name == group_name)
    if slot_type and slot_type != "ALL":
        query = query.filter(models.RackSlot.slot_type == slot_type)

    slots = query.order_by(models.RackSlot.slot_number.asc()).all()
    
    # Her slot için beklenen ağırlığı o askıdaki Vitrinde olan ürünlerin toplamı olarak doğrula
    for s in slots:
        active_prods = [p for p in s.products if p.status == "Vitrinde"]
        total_w = sum(p.weight_grams * (p.stock_quantity if (p.stock_quantity and p.stock_quantity > 0) else 1) for p in active_prods)
        if s.status != "ALERT" and s.expected_weight != total_w:
            s.expected_weight = round(total_w, 2)
            if s.current_weight == 0 and total_w > 0:
                s.current_weight = round(total_w, 2)

    return slots


@router.get("/groups", response_model=List[str])
def list_slot_groups(db: Session = Depends(get_db)):
    groups = db.query(models.RackSlot.group_name).distinct().all()
    group_list = [g[0] for g in groups if g[0]]
    if not group_list:
        group_list = ["Ana Vitrin", "Yüzük Tablası 1", "Bilezik Standı", "Çelik Kasa"]
    return sorted(list(set(group_list)))


@router.api_route("/slots/{slot_id}/identify-lift", methods=["GET", "POST"], response_model=schemas.IdentifyLiftResponse)
def identify_lift_candidates(
    slot_id: int,
    weight_lost: Optional[float] = Query(None),
    payload: Optional[dict] = Body(None),
    db: Session = Depends(get_db)
):
    """Askıdan ağırlık eksildiğinde o askıdaki modeller arasından eksilen gramaja en uygun olanları listeleme"""
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    lost = weight_lost
    if (lost is None or lost <= 0) and payload and "weight_lost" in payload:
        lost = float(payload["weight_lost"])
    if lost is None or lost <= 0:
        lost = max(0.0, slot.expected_weight - slot.current_weight)

    candidates = []
    # Askıda Vitrinde olan ürünler
    active_products = [p for p in slot.products if p.status == "Vitrinde"]
    
    # Eğer aktif ürün yoksa tüm vitrin ürünlerine bak
    if not active_products:
        active_products = db.query(models.Product).filter(models.Product.status == "Vitrinde").all()

    for p in active_products:
        p_stock = p.stock_quantity or 1
        p_variants = p.variants or []

        # DURUM 1: Ürünün alt varyantları varsa (Farklı gramajlı parçalar)
        if len(p_variants) > 0:
            best_combo = None
            best_diff = 999999.0
            max_take = min(len(p_variants), 6)

            for k in range(1, max_take + 1):
                for combo in itertools.combinations(p_variants, k):
                    comb_weight = sum(v.weight_grams for v in combo)
                    d = abs(comb_weight - lost)
                    if d < best_diff:
                        best_diff = d
                        best_combo = combo

            if best_combo:
                comb_weight = sum(v.weight_grams for v in best_combo)
                qty = len(best_combo)
                
                if best_diff <= 0.2:
                    score = 99
                elif best_diff <= 0.5:
                    score = 94
                elif best_diff <= 1.0:
                    score = 85
                elif best_diff <= 2.5:
                    score = 70
                else:
                    score = max(10, int(100 - (best_diff * 10)))

                comb_avg = round(comb_weight / qty, 2)
                variant_desc = f"{qty} Adet Alındı • Ortalama {comb_avg:.2f} gr/adet (" + " + ".join([f"{v.weight_grams:.2f}g" for v in best_combo]) + f" = {comb_weight:.2f} gr)"
                unit_price = p.price or 0.0
                total_est_price = round(unit_price * qty, 2)

                candidates.append({
                    "product_id": p.id,
                    "product_name": p.name,
                    "barcode": p.barcode,
                    "purity": p.purity,
                    "weight_grams": p.weight_grams,
                    "price": total_est_price,
                    "image_url": p.image_url,
                    "diff_grams": round(best_diff, 2),
                    "confidence_score": score,
                    "estimated_quantity": qty,
                    "total_calculated_weight": round(comb_weight, 2),
                    "average_grams_per_unit": comb_avg,
                    "stock_available": p_stock,
                    "matched_variants_desc": variant_desc,
                    "variant_ids": [v.id for v in best_combo],
                    "has_variants": True
                })

        # DURUM 2: Varyant yok ama adetli stok (stock_quantity > 1)
        elif p_stock > 1:
            unit_w = p.weight_grams or 1.0
            raw_qty = round(lost / unit_w) if unit_w > 0 else 1
            est_qty = max(1, min(p_stock, raw_qty))
            tot_w = est_qty * unit_w
            diff = abs(tot_w - lost)
            avg_w = round(tot_w / est_qty, 2)

            if diff <= 0.2:
                score = 98
            elif diff <= 0.5:
                score = 90
            elif diff <= 1.0:
                score = 82
            elif diff <= 2.5:
                score = 65
            else:
                score = max(10, int(100 - (diff * 10)))

            candidates.append({
                "product_id": p.id,
                "product_name": p.name,
                "barcode": p.barcode,
                "purity": p.purity,
                "weight_grams": p.weight_grams,
                "price": round((p.price or 0.0) * est_qty, 2),
                "image_url": p.image_url,
                "diff_grams": round(diff, 2),
                "confidence_score": score,
                "estimated_quantity": est_qty,
                "total_calculated_weight": round(tot_w, 2),
                "average_grams_per_unit": avg_w,
                "stock_available": p_stock,
                "matched_variants_desc": f"{est_qty} Adet Alındı • Ortalama {avg_w:.2f} gr/adet (Toplam {tot_w:.2f} gr)",
                "variant_ids": [],
                "has_variants": False
            })

        # DURUM 3: Tek adetli klasik ürün
        else:
            diff = abs(p.weight_grams - lost)
            if diff <= 0.2:
                score = 98
            elif diff <= 0.5:
                score = 90
            elif diff <= 1.0:
                score = 80
            elif diff <= 2.5:
                score = 65
            else:
                score = max(10, int(100 - (diff * 10)))

            candidates.append({
                "product_id": p.id,
                "product_name": p.name,
                "barcode": p.barcode,
                "purity": p.purity,
                "weight_grams": p.weight_grams,
                "price": p.price or 0.0,
                "image_url": p.image_url,
                "diff_grams": round(diff, 2),
                "confidence_score": score,
                "estimated_quantity": 1,
                "total_calculated_weight": round(p.weight_grams, 2),
                "average_grams_per_unit": round(p.weight_grams, 2),
                "stock_available": 1,
                "matched_variants_desc": f"1 Adet Alındı • Ortalama {p.weight_grams:.2f} gr/adet (Tekil Model: {p.weight_grams:.2f} gr)",
                "variant_ids": [],
                "has_variants": False
            })

    # En yakın farkı ve en yüksek güveni en üste sırala
    candidates.sort(key=lambda x: (x["diff_grams"], -x["confidence_score"]))

    return {
        "slot_number": slot.slot_number,
        "slot_id": slot.id,
        "weight_lost": round(lost, 2),
        "candidates": candidates
    }


@router.post("/custody/take")
async def take_into_custody(
    req: schemas.CustodyTakeRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Personel askıdan çıkan ürünü onaylar -> Ürün personelin zimmetine / masasına geçer, alarm susar"""
    product = db.query(models.Product).filter(models.Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    slot = db.query(models.RackSlot).filter(models.RackSlot.id == req.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    # Kullanıcı tespiti (JWT veya user_id fallback)
    acting_user = current_user
    if not acting_user and req.user_id:
        acting_user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not acting_user:
        acting_user = db.query(models.User).filter(models.User.role == "STAFF").first() or db.query(models.User).first()

    user_id = acting_user.id if acting_user else 1
    user_name = acting_user.full_name if acting_user else "Personel"

    current_stock = product.stock_quantity if (product.stock_quantity and product.stock_quantity > 0) else 1
    requested_qty = max(1, req.quantity or 1)
    take_qty = min(requested_qty, current_stock)

    weight_lost = round(req.actual_grams, 2) if (req.actual_grams and req.actual_grams > 0) else round(product.weight_grams * take_qty, 2)
    now_utc = datetime.datetime.utcnow()

    # Eğer askıda aynı üründen birden fazla adet varsa ve sadece bir kısmı alınıyorsa:
    if current_stock > take_qty:
        # 1. Askıdaki ürünün adetini eksilt, ürün vitrinde kalmaya devam eder
        product.stock_quantity = current_stock - take_qty
        
        # 2. Zimmete alınan parça için bağımsız bir zimmet ürünü oluştur
        custody_product = models.Product(
            barcode=f"{product.barcode}-Z{int(now_utc.timestamp())}",
            name=product.name,
            category=product.category,
            purity=product.purity,
            milyem=product.milyem,
            gold_color=product.gold_color,
            weight_grams=weight_lost,
            labor_cost=product.labor_cost,
            cost_price=product.cost_price,
            price=product.price,
            image_url=product.image_url,
            description=product.description,
            status="Zimmette",
            min_stock_alert=product.min_stock_alert,
            craftsmanship_type=product.craftsmanship_type,
            surface_finish=product.surface_finish,
            workshop_origin=product.workshop_origin,
            allow_engraving=product.allow_engraving,
            has_stones=product.has_stones,
            gemstone_type=product.gemstone_type,
            diamond_carat=product.diamond_carat,
            diamond_color=product.diamond_color,
            diamond_clarity=product.diamond_clarity,
            diamond_cut=product.diamond_cut,
            stone_shape=product.stone_shape,
            stone_certificate=product.stone_certificate,
            certificate_no=product.certificate_no,
            size_or_length=product.size_or_length,
            stock_quantity=take_qty,
            branch_id=product.branch_id,
            slot_id=None,
            custody_user_id=user_id,
            custody_started_at=now_utc,
            view_count=(product.view_count or 0) + 1,
            total_inspection_seconds=0
        )
        db.add(custody_product)
        db.flush()
        target_product = custody_product
    else:
        # Ürünün tüm stoğu (veya zaten 1 adet olan) zimmete alınıyor
        product.status = "Zimmette"
        product.stock_quantity = take_qty
        product.slot_id = None
        product.custody_user_id = user_id
        product.custody_started_at = now_utc
        product.view_count = (product.view_count or 0) + 1
        target_product = product

    # Askının beklenen ağırlığından bu ürünün ağırlığını düş
    slot.expected_weight = max(0.0, round(slot.expected_weight - weight_lost, 2))
    slot.current_weight = slot.expected_weight
    slot.status = "NORMAL" if slot.expected_weight > 0 else "EMPTY"

    # Bu askının aktif alarmı varsa otomatik çöz
    active_alerts = db.query(models.SecurityAlert).filter(
        models.SecurityAlert.slot_id == slot.id,
        models.SecurityAlert.is_resolved == False
    ).all()
    for alert in active_alerts:
        alert.is_resolved = True
        alert.resolved_by = f"ZİMMET ({user_name})"
        alert.resolved_at = now_utc

    # İnceleme logu oluştur
    inspection = models.InspectionLog(
        product_id=target_product.id,
        slot_id=slot.id,
        lifted_at=now_utc,
        was_authorized=True
    )
    db.add(inspection)

    # Audit log
    log = models.SystemLog(
        level="INFO",
        module="IOT",
        message=f"Ürün zimmete alındı ({take_qty} Adet): {target_product.name} ({weight_lost}g) -> Danışman: {user_name}",
        user_id=user_id,
        user_name=user_name,
        details_json=json.dumps({
            "product_id": target_product.id,
            "slot_number": slot.slot_number,
            "weight": weight_lost,
            "quantity": take_qty
        })
    )
    db.add(log)

    db.commit()
    db.refresh(target_product)
    db.refresh(slot)

    # WebSocket ile anons et
    await iot_service.manager.broadcast({
        "type": "CUSTODY_TAKEN",
        "product_id": target_product.id,
        "product_name": target_product.name,
        "weight_grams": target_product.weight_grams,
        "quantity": take_qty,
        "slot_id": slot.id,
        "slot_number": slot.slot_number,
        "custody_user_id": user_id,
        "custody_user_name": user_name,
        "new_expected_weight": slot.expected_weight
    })

    return {
        "status": "success",
        "message": f"{target_product.name} ({take_qty} Adet) başarıyla zimmetinize alındı ve alarm susturuldu.",
        "product_id": target_product.id,
        "quantity": take_qty,
        "custody_user": user_name
    }


@router.post("/custody/return-to-rack")
async def return_to_rack(
    req: schemas.CustodyReturnRequest,
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Müşteri ürünü almaktan vazgeçtiğinde ürünü tekrar askıya / vitrine geri koyma"""
    product = db.query(models.Product).filter(models.Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    slot = product.slot
    if not slot:
        slot = db.query(models.RackSlot).filter(models.RackSlot.slot_number == 1).first()

    acting_user = current_user
    if not acting_user:
        acting_user = db.query(models.User).filter(models.User.role == "STAFF").first() or db.query(models.User).first()
    user_name = acting_user.full_name if acting_user else "Personel"

    # İnceleme süresi hesapla
    duration = 0
    if product.custody_started_at:
        duration = int((datetime.datetime.utcnow() - product.custody_started_at).total_seconds())
    minutes_str = f"{duration // 60} dk {duration % 60} sn" if duration >= 60 else f"{duration} sn"

    qty = product.stock_quantity if (product.stock_quantity and product.stock_quantity > 0) else 1
    added_weight = round(product.weight_grams * qty, 2)

    # Eğer bu ürün ayrışmış bir parça ise (barkodunda -Z varsa) ana ürünle birleştir
    is_split = "-Z" in (product.barcode or "")
    if is_split:
        base_barcode = product.barcode.split("-Z")[0]
        original_product = db.query(models.Product).filter(
            models.Product.barcode == base_barcode,
            models.Product.status == "Vitrinde"
        ).first()

        if original_product:
            original_product.stock_quantity = (original_product.stock_quantity or 0) + qty
            # Geçici zimmet kaydını sil
            db.delete(product)
            target_p = original_product
        else:
            product.status = "Vitrinde"
            product.slot_id = slot.id
            product.custody_user_id = None
            product.custody_started_at = None
            target_p = product
    else:
        product.status = "Vitrinde"
        product.slot_id = slot.id
        product.custody_user_id = None
        product.custody_started_at = None
        target_p = product

    # Askının beklenen ağırlığına geri ekle
    slot.expected_weight = round(slot.expected_weight + added_weight, 2)
    slot.current_weight = slot.expected_weight
    slot.status = "NORMAL"

    # Audit log
    log = models.SystemLog(
        level="INFO",
        module="IOT",
        message=f"Ürün masadan vitrine geri koyuldu ({qty} Adet): {target_p.name} (Askı #{slot.slot_number}) - İnceleme süresi: {minutes_str}",
        user_id=acting_user.id if acting_user else 1,
        user_name=user_name,
        details_json=json.dumps({
            "product_id": target_p.id,
            "slot_number": slot.slot_number,
            "quantity": qty,
            "weight": added_weight,
            "duration_seconds": duration
        })
    )
    db.add(log)

    db.commit()
    db.refresh(slot)

    await iot_service.manager.broadcast({
        "type": "CUSTODY_RETURNED",
        "product_id": target_p.id,
        "product_name": target_p.name,
        "slot_id": slot.id,
        "slot_number": slot.slot_number,
        "quantity": qty,
        "new_expected_weight": slot.expected_weight,
        "duration_seconds": duration
    })

    return {
        "status": "success",
        "message": f"{target_p.name} ({qty} Adet) vitrine geri yerleştirildi (İnceleme Süresi: {minutes_str}).",
        "slot_number": slot.slot_number
    }


@router.get("/custody/my-items", response_model=List[schemas.ProductOut])
def get_my_custody_items(
    user_id: Optional[int] = Query(None),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Personelin şu anda elinde / masasında denettiği ürünler"""
    target_user_id = None
    if current_user:
        target_user_id = current_user.id
    elif user_id:
        target_user_id = user_id

    query = db.query(models.Product).filter(models.Product.status == "Zimmette")
    if target_user_id:
        query = query.filter(models.Product.custody_user_id == target_user_id)
    items = query.all()
    return items


@router.post("/slots/{slot_id}/assign")
async def assign_product_to_slot(
    slot_id: int,
    payload: schemas.SlotAssignRequest,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    if payload.action == "ADD":
        product.slot_id = slot.id
        product.status = "Vitrinde"
        msg = f"Ürün askıya eklendi: {product.name} ({product.weight_grams}g) -> #{slot.slot_number} {slot.label}"
    else:
        product.slot_id = None
        product.status = "Kasada"
        msg = f"Ürün askıdan çıkarıldı: {product.name} -> Kasaya alındı"

    db.flush()
    # Slot beklenen ağırlığını güncelle
    active_prods = db.query(models.Product).filter(
        models.Product.slot_id == slot.id,
        models.Product.status == "Vitrinde"
    ).all()
    total_w = sum(p.weight_grams * (p.stock_quantity if (p.stock_quantity and p.stock_quantity > 0) else 1) for p in active_prods)
    slot.expected_weight = round(total_w, 2)
    slot.current_weight = round(total_w, 2)
    slot.status = "NORMAL" if total_w > 0 else "EMPTY"

    log = models.SystemLog(
        level="INFO",
        module="INVENTORY",
        message=msg,
        user_id=admin.id,
        user_name=admin.full_name
    )
    db.add(log)
    db.commit()

    await iot_service.manager.broadcast({
        "type": "SLOT_ASSIGNED",
        "slot_number": slot.slot_number,
        "slot_id": slot.id,
        "expected_weight": slot.expected_weight,
        "current_weight": slot.current_weight
    })

    return {"message": msg, "slot_id": slot.id, "product_id": product.id, "total_weight": slot.expected_weight}


@router.post("/slots", response_model=schemas.RackSlotOut)
def create_slot(
    slot_in: schemas.SlotCreateRequest,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(models.RackSlot).filter(models.RackSlot.slot_number == slot_in.slot_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu slot numarası ile kayıtlı bir cihaz zaten var.")

    slot = models.RackSlot(
        slot_number=slot_in.slot_number,
        label=slot_in.label,
        slot_type=slot_in.slot_type or "Askı",
        group_name=slot_in.group_name or "Ana Vitrin",
        device_id=slot_in.device_id,
        ip_address=slot_in.ip_address,
        port=slot_in.port,
        tolerance_grams=slot_in.tolerance_grams,
        is_online=True,
        expected_weight=0.0,
        current_weight=0.0,
        status="EMPTY"
    )
    db.add(slot)
    
    log = models.SystemLog(
        level="INFO",
        module="IOT",
        message=f"Yeni IoT Cihazı tanımlandı: #{slot.slot_number} - {slot.label} ({slot.group_name})",
        user_id=admin.id,
        user_name=admin.full_name
    )
    db.add(log)
    
    db.commit()
    db.refresh(slot)
    return slot


@router.put("/slots/{slot_id}/device-config", response_model=schemas.RackSlotOut)
async def update_slot_device_config(
    slot_id: int,
    config: schemas.SlotDeviceConfigUpdate,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı/Tabla bulunamadı")

    if config.label is not None:
        slot.label = config.label
    if config.slot_type is not None:
        slot.slot_type = config.slot_type
    if config.group_name is not None:
        slot.group_name = config.group_name
    if config.device_id is not None:
        slot.device_id = config.device_id
    if config.ip_address is not None:
        slot.ip_address = config.ip_address
    if config.port is not None:
        slot.port = config.port
    if config.tolerance_grams is not None:
        slot.tolerance_grams = config.tolerance_grams
    if config.is_online is not None:
        slot.is_online = config.is_online
    if config.is_active is not None:
        slot.is_active = config.is_active
        if not slot.is_active:
            slot.status = "DISABLED"
        else:
            slot.status = "NORMAL" if slot.expected_weight > 0 else "EMPTY"

    slot.last_ping = datetime.datetime.utcnow()
    db.commit()
    db.refresh(slot)

    await iot_service.manager.broadcast({
        "type": "SLOT_UPDATED",
        "slot_id": slot.id,
        "slot_number": slot.slot_number,
        "is_active": slot.is_active,
        "status": slot.status
    })
    return slot


@router.post("/slots/{slot_id}/toggle-active", response_model=schemas.RackSlotOut)
async def toggle_slot_active(
    slot_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Cihaz / Askı bulunamadı")

    slot.is_active = not bool(slot.is_active)
    if not slot.is_active:
        slot.status = "DISABLED"
        action_msg = "devre dışı bırakıldı (PASİF)"
    else:
        slot.status = "NORMAL" if slot.expected_weight > 0 else "EMPTY"
        action_msg = "yeniden aktif edildi (AKTİF)"

    log = models.SystemLog(
        level="WARNING" if not slot.is_active else "INFO",
        module="IOT",
        message=f"IoT Cihazı #{slot.slot_number} ({slot.label}) {action_msg}.",
        user_id=admin.id,
        user_name=admin.full_name
    )
    db.add(log)
    db.commit()
    db.refresh(slot)

    await iot_service.manager.broadcast({
        "type": "SLOT_UPDATED",
        "slot_id": slot.id,
        "slot_number": slot.slot_number,
        "is_active": slot.is_active,
        "status": slot.status
    })

    return slot


@router.delete("/slots/{slot_id}")
async def delete_slot(
    slot_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Cihaz / Askı bulunamadı")

    slot_no = slot.slot_number
    slot_label = slot.label

    # Slot üzerindeki ürünleri güvenli bir şekilde boşa çıkar (Kasaya al)
    for p in slot.products:
        p.slot_id = None
        p.status = "Kasada"

    # Slot üzerindeki güvenlik alarmlarını çöz veya temizle
    alerts = db.query(models.SecurityAlert).filter(models.SecurityAlert.slot_id == slot.id).all()
    for a in alerts:
        a.is_resolved = True
        a.resolved_by = admin.full_name
        a.resolved_at = datetime.datetime.utcnow()

    log = models.SystemLog(
        level="WARNING",
        module="IOT",
        message=f"IoT Cihazı #{slot_no} ({slot_label}) sistemden tamamen kaldırıldı. Ürünler kasaya aktarıldı.",
        user_id=admin.id,
        user_name=admin.full_name
    )
    db.add(log)

    db.delete(slot)
    db.commit()

    await iot_service.manager.broadcast({
        "type": "SLOT_DELETED",
        "slot_id": slot_id,
        "slot_number": slot_no
    })

    return {"status": "success", "message": f"IoT Cihazı #{slot_no} başarıyla kaldırıldı ve ürünler kasaya alındı."}


@router.post("/slots/{slot_id}/ping-device")
async def ping_device_by_ip(
    slot_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    """
    IoT Cihazının IP adresine doğrudan HTTP GET /api/status isteği atarak
    cihazın donanım sağlığını, Wi-Fi sinyal gücünü ve yanıt süresini canlı test eder.
    """
    import urllib.request
    import time
    
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Cihaz bulunamadı")

    target_ip = (slot.ip_address or "").strip()
    target_port = slot.port or 80

    if not target_ip or target_ip.startswith("0.0."):
        return {
            "status": "error",
            "reachable": False,
            "message": f"#{slot.slot_number} cihazı için geçerli bir IP adresi tanımlanmamış."
        }

    device_url = f"http://{target_ip}:{target_port}/api/status"
    t_start = time.time()
    
    try:
        req = urllib.request.Request(device_url, headers={"User-Agent": "SarrafErdem-ERP/PingTool"})
        with urllib.request.urlopen(req, timeout=2.5) as res:
            latency = int((time.time() - t_start) * 1000)
            if res.status == 200:
                raw_json = json.loads(res.read().decode("utf-8"))
                slot.is_online = True
                slot.last_ping = datetime.datetime.utcnow()
                db.commit()
                
                await iot_service.manager.broadcast({
                    "type": "DEVICE_PINGED",
                    "slot_id": slot.id,
                    "slot_number": slot.slot_number,
                    "is_online": True,
                    "latency_ms": latency
                })
                
                return {
                    "status": "success",
                    "reachable": True,
                    "latency_ms": latency,
                    "target_url": f"http://{target_ip}:{target_port}",
                    "device_data": raw_json,
                    "message": f"Cihaz çevrimiçi! Yanıt süresi: {latency} ms (Wi-Fi Sinyali: {raw_json.get('wifi_rssi', -60)} dBm)"
                }
    except Exception as e:
        latency = int((time.time() - t_start) * 1000)
        slot.is_online = False
        db.commit()
        
        await iot_service.manager.broadcast({
            "type": "DEVICE_PINGED",
            "slot_id": slot.id,
            "slot_number": slot.slot_number,
            "is_online": False,
            "latency_ms": latency
        })
        
        return {
            "status": "error",
            "reachable": False,
            "latency_ms": latency,
            "target_url": f"http://{target_ip}:{target_port}",
            "message": f"{target_ip}:{target_port} adresine ulaşılamadı. Cihaz kapalı veya Wi-Fi ağına bağlı değil."
        }



@router.post("/telemetry")
async def receive_telemetry(payload: schemas.TelemetryPayload, db: Session = Depends(get_db)):
    result = await iot_service.process_telemetry(
        db=db,
        slot_number=payload.slot_number,
        current_weight=payload.weight_grams,
        device_id=payload.device_id
    )
    return {"status": "success", "data": result}


@router.get("/demand-analytics")
def get_demand_analytics(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    analytics = []

    for p in products:
        sales_count = db.query(models.Sale).filter(models.Sale.product_id == p.id).count()
        total_seconds = p.total_inspection_seconds or 0
        minutes = round(total_seconds / 60, 1)
        
        if (p.view_count or 0) > 15 and sales_count == 0:
            advice = "⚠️ Yüksek İlgi / Düşük Satış: Fiyat veya işçilik müşteriye yüksek gelebilir, kampanya önerilir."
            status_tag = "YÜKSEK İLGİ"
        elif sales_count > 0:
            advice = "✅ Başarılı Ürün: Hızlı satışa dönüyor, vitrinde ön planda tutulmalı."
            status_tag = "SATILDI / POPÜLER"
        elif (p.view_count or 0) < 3:
            advice = "ℹ️ Düşük İlgi: Vitrinin daha aydınlık veya merkezi bir askısına/tablasına taşınabilir."
            status_tag = "DÜŞÜK İLGİ"
        else:
            advice = "🟡 Normal Seyir: Müşteri ilgisi dengeli."
            status_tag = "DENGELİ"

        analytics.append({
            "product_id": p.id,
            "product_name": p.name,
            "barcode": p.barcode,
            "category": p.category,
            "purity": p.purity,
            "weight_grams": p.weight_grams,
            "price": p.price,
            "view_count": p.view_count or 0,
            "inspection_minutes": minutes,
            "sales_count": sales_count,
            "current_status": p.status,
            "status_tag": status_tag,
            "advice": advice
        })

    analytics.sort(key=lambda x: (x["view_count"], x["sales_count"]), reverse=True)
    return analytics


@router.post("/slots/{slot_id}/authorize-inspection")
async def authorize_inspection(slot_id: int, req: schemas.SetAuthorizedInspectionRequest, db: Session = Depends(get_db)):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    slot.is_inspection_authorized = req.authorized
    db.commit()

    await iot_service.manager.broadcast({
        "type": "INSPECTION_AUTH_CHANGED",
        "slot_number": slot.slot_number,
        "is_inspection_authorized": slot.is_inspection_authorized
    })

    return {"message": f"Askı #{slot.slot_number} inceleme yetkisi: {req.authorized}"}


@router.post("/slots/{slot_id}/calibrate")
async def calibrate_slot(
    slot_id: int,
    admin: models.User = Depends(auth.require_admin),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    slot.expected_weight = slot.current_weight
    slot.status = "NORMAL" if slot.current_weight > 0 else "EMPTY"
    
    log = models.SystemLog(
        level="INFO",
        module="IOT",
        message=f"Sensör daralandı/kalibre edildi: #{slot.slot_number} ({slot.label}) -> {slot.expected_weight}g",
        user_id=admin.id,
        user_name=admin.full_name
    )
    db.add(log)
    db.commit()

    await iot_service.manager.broadcast({
        "type": "SLOT_CALIBRATED",
        "slot_number": slot.slot_number,
        "expected_weight": slot.expected_weight,
        "current_weight": slot.current_weight
    })

    return {"message": "Cihaz kalibre edildi", "slot_number": slot.slot_number}


@router.get("/alerts", response_model=List[schemas.SecurityAlertOut])
def list_alerts(unresolved_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.SecurityAlert)
    if unresolved_only:
        query = query.filter(models.SecurityAlert.is_resolved == False)
    return query.order_by(models.SecurityAlert.id.desc()).limit(50).all()


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    resolved_by: str = Body("Personel", embed=True),
    current_user: Optional[models.User] = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    alert = db.query(models.SecurityAlert).filter(models.SecurityAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm bulunamadı")

    resolver = current_user.full_name if current_user else resolved_by

    alert.is_resolved = True
    alert.resolved_by = resolver
    alert.resolved_at = datetime.datetime.utcnow()

    slot = alert.slot
    if slot and slot.status == "ALERT":
        slot.status = "NORMAL" if slot.expected_weight > 0 else "EMPTY"

    log = models.SystemLog(
        level="WARNING",
        module="SECURITY",
        message=f"Güvenlik alarmı çözüldü & susturuldu: {alert.message} (Çözen: {resolver})",
        user_id=current_user.id if current_user else None,
        user_name=resolver
    )
    db.add(log)
    db.commit()

    await iot_service.manager.broadcast({
        "type": "ALERT_RESOLVED",
        "alert_id": alert.id,
        "slot_id": slot.id if slot else None,
        "resolved_by": resolver
    })

    return {"message": "Alarm çözüldü ve susturuldu"}


# --- TEST VE SİMÜLASYON ENDPOINT'I ---
@router.post("/simulate")
async def simulate_iot_action(
    slot_number: int = Body(..., embed=True),
    action: str = Body(..., embed=True),
    delta_grams: Optional[float] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    slot = db.query(models.RackSlot).filter(models.RackSlot.slot_number == slot_number).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Askı bulunamadı")

    if action == "LIFT_UNAUTHORIZED":
        slot.is_inspection_authorized = False
        db.commit()
        # Eğer özel eksilen gramaj belirtilmişse o kadar eksilt, yoksa ilk ürünün ağırlığını eksilt
        drop_weight = delta_grams
        if drop_weight is None:
            first_prod = slot.products[0] if slot.products else None
            drop_weight = first_prod.weight_grams if first_prod else 25.40
        new_w = max(0.0, slot.expected_weight - drop_weight)
        res = await iot_service.process_telemetry(db, slot_number=slot.slot_number, current_weight=new_w)
        return {"action": action, "weight_dropped": drop_weight, "result": res}

    elif action == "LIFT_AUTHORIZED":
        slot.is_inspection_authorized = True
        db.commit()
        new_w = max(0.0, slot.expected_weight - (delta_grams or 20.0))
        res = await iot_service.process_telemetry(db, slot_number=slot.slot_number, current_weight=new_w)
        return {"action": action, "result": res}

    elif action == "RETURN_PRODUCT":
        res = await iot_service.process_telemetry(db, slot_number=slot.slot_number, current_weight=slot.expected_weight)
        return {"action": action, "result": res}

    elif action == "TARE":
        res = await iot_service.process_telemetry(db, slot_number=slot.slot_number, current_weight=0.0)
        return {"action": action, "result": res}

    else:
        raise HTTPException(status_code=400, detail="Bilinmeyen simülasyon aksiyonu")
