# ==============================================================================
# 💎 Sarraf Erdem IoT ERP - Canlı Altın ve Döviz Kurları Router'ı
# ==============================================================================

from fastapi import APIRouter, Query
from typing import Dict, Any
from .. import exchange_rate_service

router = APIRouter(prefix="/api/v1/rates", tags=["Canlı Altın ve Döviz Kurları"])

@router.get("/live")
def get_live_rates(refresh: bool = Query(False, description="Zorla güncel veri çek")) -> Dict[str, Any]:
    """
    Kapalıçarşı Serbest Piyasa ve TCMB'den anlık canlı altın ve döviz kurlarını döner.
    Gram Has Altın, 22K Bilezik, 18K, 14K, Çeyrek, Yarım, Tam, Ata Lira, ONS, USD, EUR ve Gümüş.
    """
    return exchange_rate_service.get_live_rates(force_refresh=refresh)
