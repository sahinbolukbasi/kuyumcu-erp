# ==============================================================================
# 💎 Golden Guard IoT ERP - ESP8266 + HX711 Ağırlık Sensörü Yapılandırması
# ==============================================================================

# --- Wi-Fi Ayarları ---
WIFI_SSID = "Sahin"
WIFI_PASSWORD = "123456789"

# --- ERP Sunucu Bilgileri ---
SERVER_HOST = "172.20.10.5"   # Bilgisayarınızın yerel IP adresi
SERVER_PORT = 8000
TELEMETRY_PATH = "/api/v1/iot/telemetry"

# --- Cihaz Kimliği ---
DEVICE_ID = "ESP8266_TERAZI_01"
SLOT_NUMBER = 1

# --- HX711 / Yük Hücresi Pin Ayarları (NodeMCU etiketleri) ---
HX711_DOUT_PIN = 4     # D2  -> HX711 "DT" pini
HX711_SCK_PIN = 5      # D1  -> HX711 "SCK" pini

# --- Kalibrasyon ---
# calibrate.py betiğini çalıştırıp buraya çıkan sonucu yazın.
# Katsayı = (bilinen ağırlık konulduğunda okunan ham değer) / (bilinen ağırlık, gram)
CALIBRATION_FACTOR = 420.0     # ÖRNEK değer - kendi terazinize göre değiştirin!
KNOWN_CALIBRATION_WEIGHT_G = 1000   # Kalibrasyonda kullanacağınız referans ağırlık (gram)

# --- Ölçüm & Gönderim Ayarları ---
READ_SAMPLES = 8              # Her ölçümde alınacak örnek sayısı (gürültüyü azaltır)
SEND_INTERVAL_SEC = 5         # ERP'ye kaç saniyede bir ağırlık gönderilecek
MIN_CHANGE_TO_SEND_G = 2.0    # Ağırlık bu kadar (gram) değişmeden tekrar gönderme (opsiyonel filtre)
MAX_CAPACITY_G = 20000        # Yük hücresi kapasitesi (20 kg = 20000 g) - güvenlik sınırı

# --- Ağ Zaman Aşımı ---
REQUEST_TIMEOUT_SEC = 4
