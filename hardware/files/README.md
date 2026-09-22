# ESP8266 + HX711 (20 kg Yük Hücresi) - Ağırlık Sensörü

## Dosyalar
- `hx711.py` — HX711 için MicroPython sürücüsü
- `config.py` — Wi-Fi, ERP ve pin ayarları
- `calibrate.py` — Kalibrasyon katsayısını bulmak için tek seferlik betik
- `main.py` — Ana firmware (Wi-Fi + ölçüm + ERP'ye gönderim)

## Kablolama

| Yük Hücresi (4 telli) | HX711 Modülü |
|---|---|
| Kırmızı (E+) | E+ |
| Siyah (E-) | E- |
| Beyaz (A-) | A- |
| Yeşil (A+) | A+ |

| HX711 Modülü | ESP8266 (NodeMCU) |
|---|---|
| VCC | 3V3 |
| GND | GND |
| DT (DOUT) | D2 (GPIO4) |
| SCK | D1 (GPIO5) |

> ⚠️ Yük hücresi kablo renkleri üreticiye göre değişebilir; üzerindeki etikete
> bakarak E+/E-/A+/A- eşleşmesini doğrulayın.

## Kurulum Sırası
1. `config.py` içindeki `WIFI_SSID`, `WIFI_PASSWORD`, `SERVER_HOST` değerlerini kendinize göre düzenleyin.
2. Tüm dosyaları (`hx711.py`, `config.py`, `main.py`, `calibrate.py`) ESP8266'ya yükleyin (Thonny veya ampy ile).
3. **Önce `calibrate.py`'yi çalıştırın** ve talimatları izleyerek kendi `CALIBRATION_FACTOR` değerinizi bulun.
4. Bulduğunuz katsayıyı `config.py` içindeki `CALIBRATION_FACTOR` satırına yazın.
5. ESP8266'yı yeniden başlatın; `main.py` otomatik çalışır, dara alır, Wi-Fi'a bağlanır ve ağırlığı periyodik olarak ERP'nizin `/api/v1/iot/telemetry` adresine POST eder.

## ERP'ye Giden Veri Formatı
```json
{
  "device_id": "ESP8266_TERAZI_01",
  "slot_number": 1,
  "weight_grams": 1234.5
}
```
