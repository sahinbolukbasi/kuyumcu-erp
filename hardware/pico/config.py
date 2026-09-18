# ==============================================================================
# 💎 Sarraf Erdem IoT ERP - Raspberry Pi Pico Yapılandırma Dosyası
# ==============================================================================

# Wi-Fi Ayarları (Pico W için)
WIFI_SSID = "Sahin"              # Bağlanılacak Wi-Fi ağının adı
WIFI_PASSWORD = "123456789"   # Wi-Fi şifresi

# ERP Sunucu Bilgileri
# NOT: Pico ile bilgisayarınızın aynı yerel ağda (Wi-Fi) olması gerekir.
# 'localhost' yerine bilgisayarınızın yerel IP adresini yazın (Örn: 192.168.1.50)
SERVER_HOST = "172.20.10.5"    # Bilgisayarınızın yerel IP adresi
SERVER_PORT = 8000                # FastAPI backend portu

# Alarm Tipi Seçimi:
# 'PANIC'     -> Güvenlik Sessiz Panik Alarmı (/api/v1/security/panic-button)
# 'SHOWCASE'  -> Vitrin Askısı İzinsiz Kaldırma Alarmı (/api/v1/iot/telemetry)
ALARM_TYPE = "PANIC"

# Showroom / Vitrin Askı Slot Numarası (SHOWCASE modu için)
SLOT_NUMBER = 1
DEVICE_ID = "PICO_VITRIN_01"

# Donanım Pin Ayarları (Raspberry Pi Pico)
# Butonun bir bacağı GP14 pinine, diğer bacağı GND pinine bağlanır.
BUTTON_PIN = 14                   # GP14 (Dahili Pull-Up kullanılır)
DEBOUNCE_MS = 250                 # Buton ark/çift tıklama önleme süresi (ms)

# Canlılık / Kesinti Kontrolü (Heartbeat) Ayarları
HEARTBEAT_INTERVAL_SEC = 5        # Sunucuya canlılık bildirimi gönderme sıklığı (saniye)
REQUEST_TIMEOUT_SEC = 4           # Zaman aşımı süresi (saniye)
