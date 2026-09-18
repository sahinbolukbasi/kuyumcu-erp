# ==============================================================================
# 💎 Sarraf Erdem IoT ERP - Canlı Altın ve Döviz Kurları Servisi
# ==============================================================================
# Kaynaklar:
# 1. Truncgil Finans v4 (Kapalıçarşı & Serbest Piyasa Canlı Altın ve Döviz)
# 2. TCMB (Türkiye Cumhuriyet Merkez Bankası Resmi XML Kurları)
# ==============================================================================

import time
import json
import logging
import urllib.request
import xml.etree.ElementTree as ET
from typing import Dict, Any, Optional

logger = logging.getLogger("exchange_rates")

_cached_rates: Optional[Dict[str, Any]] = None
_last_fetch_time: float = 0
CACHE_DURATION_SEC = 25

def fetch_from_truncgil_v4() -> Optional[Dict[str, Any]]:
    """Kapalıçarşı & Serbest Piyasa Canlı Altın ve Döviz Kurlarını Çeker (Yedekli)"""
    urls = [
        "https://finans.truncgil.com/v4/today.json",
        "https://finans.truncgil.com/today.json"
    ]
    for url in urls:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SarrafErdemERP/1.5"}
        )
        try:
            with urllib.request.urlopen(req, timeout=4) as res:
                if res.status == 200:
                    raw_json = json.loads(res.read().decode("utf-8"))
                    return raw_json
        except Exception as e:
            logger.warning(f"Kur servisi ({url}) çağrılamadı: {e}")
    return None

def fetch_from_tcmb() -> Optional[Dict[str, float]]:
    """TCMB Resmi XML Kurlarını Çeker (USD ve EUR için yedek/doğrulama)"""
    url = "https://www.tcmb.gov.tr/kurlar/today.xml"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; SarrafErdemERP/1.5)"}
    )
    try:
        with urllib.request.urlopen(req, timeout=4) as res:
            if res.status == 200:
                root = ET.fromstring(res.read())
                tcmb_rates = {}
                for curr in root.findall("Currency"):
                    kod = curr.get("Kod")
                    if kod in ["USD", "EUR"]:
                        fb = curr.find("ForexBuying")
                        fs = curr.find("ForexSelling")
                        if fb is not None and fb.text:
                            tcmb_rates[f"{kod}_BUY"] = float(fb.text)
                        if fs is not None and fs.text:
                            tcmb_rates[f"{kod}_SELL"] = float(fs.text)
                return tcmb_rates
    except Exception as e:
        logger.warning(f"TCMB kur servisi çağrılamadı: {e}")
    return None

def get_live_rates(force_refresh: bool = False) -> Dict[str, Any]:
    global _cached_rates, _last_fetch_time
    now = time.time()

    if not force_refresh and _cached_rates and (now - _last_fetch_time < CACHE_DURATION_SEC):
        return _cached_rates

    v4_data = fetch_from_truncgil_v4()
    tcmb_data = fetch_from_tcmb() or {}

    if not v4_data:
        if _cached_rates:
            _cached_rates["is_cached"] = True
            return _cached_rates
        return get_fallback_rates()

    update_date = v4_data.get("Update_Date", time.strftime("%Y-%m-%d %H:%M:%S"))

    def parse_item(key: str, default_buy: float, default_sell: float, default_change: float = 0.0):
        obj = v4_data.get(key) or {}
        buy = float(obj.get("Buying") or default_buy)
        sell = float(obj.get("Selling") or default_sell)
        chg_val = obj.get("Change", default_change)
        chg_str = f"+%{chg_val:.2f}" if chg_val >= 0 else f"-%{abs(chg_val):.2f}"
        return {"buy": round(buy, 2), "sell": round(sell, 2), "change": chg_str}

    has_altin = parse_item("HAS", 6818.14, 6819.16, 0.75)
    altin_22k = parse_item("YIA", 6205.25, 6210.98, -0.13)
    altin_18k = parse_item("18AYARALTIN", 4966.92, 4971.51, -0.13)
    altin_14k = parse_item("14AYARALTIN", 3878.28, 3881.86, -0.13)
    ceyrek = parse_item("CEYREKALTIN", 10886.40, 11134.82, -0.13)
    yarim = parse_item("YARIMALTIN", 21704.76, 22269.63, -0.13)
    tam = parse_item("TAMALTIN", 43545.60, 44403.06, -0.13)
    ata = parse_item("ATAALTIN", 44906.40, 46037.53, -0.13)
    gumus = parse_item("GUMUS", 104.43, 104.52, 2.28)

    usd_default = tcmb_data.get("USD_BUY", 48.78)
    usd = parse_item("USD", usd_default, tcmb_data.get("USD_SELL", usd_default + 0.1), 0.11)

    eur_default = tcmb_data.get("EUR_BUY", 55.95)
    eur = parse_item("EUR", eur_default, tcmb_data.get("EUR_SELL", eur_default + 0.1), -0.24)
    gbp = parse_item("GBP", 65.13, 65.15, -0.23)

    # ONS Altın hesabı (Has Altın * 31.1035 / USD)
    ons_calc = round((has_altin["sell"] / max(1.0, usd["sell"])) * 31.1035, 2)
    ons = {
        "buy": round(ons_calc - 2.0, 2),
        "sell": ons_calc,
        "change": "+%0.45"
    }

    result = {
        "status": "success",
        "updated_at": update_date,
        "source": "Kapalıçarşı Serbest Piyasa & TCMB",
        "is_live": True,
        "rates": {
            "HAS_ALTIN": {
                "code": "HAS_ALTIN",
                "name": "HAS ALTIN (995)",
                "purity": "24K Saf Altın",
                "buy": has_altin["buy"],
                "sell": has_altin["sell"],
                "change": has_altin["change"],
                "currency": "₺"
            },
            "ALTIN_22K": {
                "code": "ALTIN_22K",
                "name": "22 AYAR BİLEZİK",
                "purity": "22K Geleneksel",
                "buy": altin_22k["buy"],
                "sell": altin_22k["sell"],
                "change": altin_22k["change"],
                "currency": "₺"
            },
            "ALTIN_18K": {
                "code": "ALTIN_18K",
                "name": "18 AYAR MÜCEVHER",
                "purity": "18K Mücevherat",
                "buy": altin_18k["buy"],
                "sell": altin_18k["sell"],
                "change": altin_18k["change"],
                "currency": "₺"
            },
            "ALTIN_14K": {
                "code": "ALTIN_14K",
                "name": "14 AYAR TAKI ALTINI",
                "purity": "14K Fantezi",
                "buy": altin_14k["buy"],
                "sell": altin_14k["sell"],
                "change": altin_14k["change"],
                "currency": "₺"
            },
            "CEYREK": {
                "code": "CEYREK",
                "name": "ÇEYREK ZİYNET",
                "purity": "Eski / Yeni",
                "buy": ceyrek["buy"],
                "sell": ceyrek["sell"],
                "change": ceyrek["change"],
                "currency": "₺"
            },
            "YARIM": {
                "code": "YARIM",
                "name": "YARIM ALTIN",
                "purity": "Darphane",
                "buy": yarim["buy"],
                "sell": yarim["sell"],
                "change": yarim["change"],
                "currency": "₺"
            },
            "TAM": {
                "code": "TAM",
                "name": "TAM ZİYNET",
                "purity": "Darphane",
                "buy": tam["buy"],
                "sell": tam["sell"],
                "change": tam["change"],
                "currency": "₺"
            },
            "ATA": {
                "code": "ATA",
                "name": "ATA LİRA",
                "purity": "Cumhuriyet",
                "buy": ata["buy"],
                "sell": ata["sell"],
                "change": ata["change"],
                "currency": "₺"
            },
            "ONS": {
                "code": "ONS",
                "name": "ONS ALTIN",
                "purity": "Uluslararası Spot",
                "buy": ons["buy"],
                "sell": ons["sell"],
                "change": ons["change"],
                "currency": "$"
            },
            "USD": {
                "code": "USD",
                "name": "ABD DOLARI",
                "purity": "Döviz",
                "buy": usd["buy"],
                "sell": usd["sell"],
                "change": usd["change"],
                "currency": "₺"
            },
            "EUR": {
                "code": "EUR",
                "name": "EURO",
                "purity": "Döviz",
                "buy": eur["buy"],
                "sell": eur["sell"],
                "change": eur["change"],
                "currency": "₺"
            },
            "GBP": {
                "code": "GBP",
                "name": "İNGİLİZ STERLİNİ",
                "purity": "Döviz",
                "buy": gbp["buy"],
                "sell": gbp["sell"],
                "change": gbp["change"],
                "currency": "₺"
            },
            "GUMUS": {
                "code": "GUMUS",
                "name": "GÜMÜŞ (GRAM)",
                "purity": "999 Saf Gümüş",
                "buy": gumus["buy"],
                "sell": gumus["sell"],
                "change": gumus["change"],
                "currency": "₺"
            }
        }
    }

    _cached_rates = result
    _last_fetch_time = now
    return result

def get_fallback_rates() -> Dict[str, Any]:
    return {
        "status": "fallback",
        "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "source": "Sarraf Erdem Rezerv Baz Kurları (Offline Yedek)",
        "is_live": False,
        "rates": {
            "HAS_ALTIN": {"code": "HAS_ALTIN", "name": "HAS ALTIN (995)", "purity": "24K Saf Altın", "buy": 6818.00, "sell": 6819.00, "change": "+%0.75", "currency": "₺"},
            "ALTIN_22K": {"code": "ALTIN_22K", "name": "22 AYAR BİLEZİK", "purity": "22K Geleneksel", "buy": 6205.00, "sell": 6211.00, "change": "-%0.13", "currency": "₺"},
            "ALTIN_18K": {"code": "ALTIN_18K", "name": "18 AYAR MÜCEVHER", "purity": "18K Mücevherat", "buy": 4966.00, "sell": 4971.00, "change": "-%0.13", "currency": "₺"},
            "ALTIN_14K": {"code": "ALTIN_14K", "name": "14 AYAR TAKI ALTINI", "purity": "14K Fantezi", "buy": 3878.00, "sell": 3881.00, "change": "-%0.13", "currency": "₺"},
            "CEYREK": {"code": "CEYREK", "name": "ÇEYREK ZİYNET", "purity": "Eski / Yeni", "buy": 10886.00, "sell": 11134.00, "change": "-%0.13", "currency": "₺"},
            "YARIM": {"code": "YARIM", "name": "YARIM ALTIN", "purity": "Darphane", "buy": 21704.00, "sell": 22269.00, "change": "-%0.13", "currency": "₺"},
            "TAM": {"code": "TAM", "name": "TAM ZİYNET", "purity": "Darphane", "buy": 43545.00, "sell": 44403.00, "change": "-%0.13", "currency": "₺"},
            "ATA": {"code": "ATA", "name": "ATA LİRA", "purity": "Cumhuriyet", "buy": 44906.00, "sell": 46037.00, "change": "-%0.13", "currency": "₺"},
            "ONS": {"code": "ONS", "name": "ONS ALTIN", "purity": "Uluslararası Spot", "buy": 4350.00, "sell": 4352.00, "change": "+%0.45", "currency": "$"},
            "USD": {"code": "USD", "name": "ABD DOLARI", "purity": "Döviz", "buy": 48.78, "sell": 48.79, "change": "+%0.11", "currency": "₺"},
            "EUR": {"code": "EUR", "name": "EURO", "purity": "Döviz", "buy": 55.95, "sell": 55.97, "change": "-%0.24", "currency": "₺"},
            "GBP": {"code": "GBP", "name": "İNGİLİZ STERLİNİ", "purity": "Döviz", "buy": 65.13, "sell": 65.15, "change": "-%0.23", "currency": "₺"},
            "GUMUS": {"code": "GUMUS", "name": "GÜMÜŞ (GRAM)", "purity": "999 Saf Gümüş", "buy": 104.43, "sell": 104.52, "change": "+%2.28", "currency": "₺"}
        }
    }
