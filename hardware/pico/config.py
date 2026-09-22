# ==============================================================================
# 💎 Golden Guard IoT ERP - Raspberry Pi Pico Yapılandırma Dosyası
# ==============================================================================

# Wi-Fi Ayarları (Pico W için)
WIFI_SSID = "Sahin"              # Bağlanılacak Wi-Fi ağının adı
WIFI_PASSWORD = "123456789"   # Wi-Fi şifresi

# ERP Sunucu Bilgileri
# Pico, internet bağlantısı olan herhangi bir Wi-Fi ağından
# goldenguard.uk API'sine veri gönderebilir.
# ⚠️ ÖNEMLİ: MicroPython mbed TLS, Nginx TLSv1.2 cipher'ları ile uyumsuzdur.
# Bu nedenle HTTP (port 80) kullanılır, güvenlik X-Device-Key API anahtarı ile sağlanır.
SERVER_HOST = "goldenguard.uk"  # Public API domain
SERVER_PORT = 80                 # HTTP port (SSL uyumsuzluğu nedeniyle HTTP kullanılır)
USE_HTTPS = False                # SSL/TLS kapalı (güvenlik X-Device-Key ile sağlanır)

# Cihaz API Anahtarı (X-Device-Key)
# ERP'de Cihaz Yönetimi -> Eşleştir -> Anahtar Al butonundan alınır.
# Bu anahtar HTTP üzerinden güvenli iletişim sağlar.
DEVICE_KEY = ""                   # Örn: "GG-IoT-..." veya token_urlsafe(48) çıktısı

# Cihaz Kayıt (Register) Ayarları
# Wi-Fi bağlandıktan sonra ERP'ye otomatik kayıt yapılır.
REGISTER_ENABLED = True           # Kayıt aktif/pasif
REGISTER_RETRY_SEC = 10           # Kayıt başarısız olursa tekrar deneme aralığı (saniye)

# 6 Haneli Eşleştirme Kodu
# ERP'de "Kod ile Eşle" butonundan alınan 6 haneli kodu buraya yazın.
PAIR_CODE = ""                    # Örn: "482917"

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

# HX711 Ağırlık Sensörü Pinleri
HX711_DT_PIN = 2                  # GP2 (DT / Data) - HX711 DOUT pinine
HX711_SCK_PIN = 3                 # GP3 (SCK / Clock) - HX711 SCK pinine
HX711_REFERENCE_UNIT = 420.0      # Kalibrasyon katsayısı (okuma birimi -> gram)
HX711_OFFSET = 0.0                # Dara ofseti (boş tabla ağırlığı)

# Canlılık / Kesinti Kontrolü (Heartbeat) Ayarları
HEARTBEAT_INTERVAL_SEC = 5        # Sunucuya canlılık bildirimi gönderme sıklığı (saniye)
REQUEST_TIMEOUT_SEC = 4           # Zaman aşımı süresi (saniye)
