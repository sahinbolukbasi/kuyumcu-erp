import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/v1/analytics", tags=["Analitik & Gün Sonu ERP"])

@router.get("/daily-summary", response_model=schemas.DailySummary)
def get_daily_summary(
    admin: models.User = Depends(auth.require_admin), # Gün sonu genel kasa raporu sadece Admin
    db: Session = Depends(get_db)
):
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    sales_today = db.query(models.Sale).filter(models.Sale.created_at >= today_start).all()
    total_sales_count = len(sales_today)
    total_sales_revenue = sum(s.sale_price for s in sales_today)
    total_gold_grams_sold = round(sum(s.weight_grams for s in sales_today), 2)

    total_in_showcase = db.query(models.Product).filter(models.Product.status == "Vitrinde").count()
    total_in_vault = db.query(models.Product).filter(models.Product.status == "Kasada").count()

    total_inspections_today = db.query(models.InspectionLog).filter(models.InspectionLog.lifted_at >= today_start).count()
    active_alerts_count = db.query(models.SecurityAlert).filter(models.SecurityAlert.is_resolved == False).count()

    category_sales_breakdown = {}
    for s in sales_today:
        cat = s.category or "Diğer"
        if cat not in category_sales_breakdown:
            category_sales_breakdown[cat] = {"count": 0, "revenue": 0.0, "grams": 0.0}
        category_sales_breakdown[cat]["count"] += 1
        category_sales_breakdown[cat]["revenue"] += s.sale_price
        category_sales_breakdown[cat]["grams"] = round(category_sales_breakdown[cat]["grams"] + s.weight_grams, 2)

    most_viewed_prods = db.query(models.Product).order_by(models.Product.view_count.desc()).limit(10).all()
    most_viewed_list = [
        {
            "id": p.id,
            "name": p.name,
            "barcode": p.barcode,
            "category": p.category,
            "purity": p.purity,
            "weight_grams": p.weight_grams,
            "price": p.price,
            "status": p.status,
            "view_count": p.view_count,
            "total_inspection_seconds": p.total_inspection_seconds,
            "slot_number": p.slot.slot_number if p.slot else None
        }
        for p in most_viewed_prods
    ]

    # Personel Karnesi
    staff_users = db.query(models.User).all()
    staff_performances = []
    for u in staff_users:
        u_sales = [s for s in sales_today if s.user_id == u.id]
        staff_performances.append({
            "user_id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "total_sales_count": len(u_sales),
            "total_revenue": sum(s.sale_price for s in u_sales),
            "total_grams_sold": round(sum(s.weight_grams for s in u_sales), 2)
        })

    return {
        "total_sales_count": total_sales_count,
        "total_sales_revenue": total_sales_revenue,
        "total_gold_grams_sold": total_gold_grams_sold,
        "total_products_in_showcase": total_in_showcase,
        "total_products_in_vault": total_in_vault,
        "total_inspections_today": total_inspections_today,
        "active_alerts_count": active_alerts_count,
        "category_sales_breakdown": category_sales_breakdown,
        "most_viewed_products": most_viewed_list,
        "staff_performances": staff_performances
    }
