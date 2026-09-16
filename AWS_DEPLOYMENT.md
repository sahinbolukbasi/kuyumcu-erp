# AWS Dağıtım ve IoT Donanım Entegrasyon Kılavuzu

Bu belge, **Kuyumculuk ERP & IoT Akıllı Vitrin Güvenlik Sistemi**'nin AWS üzerinde en düşük maliyet ve kaynak tüketimiyle (t3/t4g.micro veya Lightsail) canlıya alınmasını ve hassas ağırlık sensörlü askıların (Load Cell / ESP32) sisteme bağlanmasını açıklar.

---

## 1. En Düşük Kaynak Tüketimli AWS Dağıtımı (Low Footprint)

Bu sistem; Python FastAPI'nin asenkron yapısı ve optimize edilmiş Next.js derlemesi sayesinde **1 GB RAM**'e sahip en ucuz AWS sunucularında dahi son derece akıcı çalışır.

### Tercih Edilen Seçenekler:
1. **AWS Lightsail (Önerilen - En Kolay ve Ucuz):**
   - $3.50 veya $5 / ay (1 GB RAM, 1 vCPU, 40GB SSD, 2TB Trafik Dahil).
2. **AWS EC2 `t4g.micro` veya `t3.micro`:**
   - Free Tier kapsamında ilk 1 yıl ücretsiz veya aylık ~$3-6.

### Adım Adım Kurulum (Ubuntu 22.04 / 24.04):

1. **Sunucuya Bağlanın ve Docker'ı Kurun:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git
sudo usermod -aG docker $USER
```

2. **Projeyi Sunucuya Alın:**
```bash
git clone <repo-url> /opt/kuyumculuk
cd /opt/kuyumculuk
```

3. **Tek Komutla Ayağa Kaldırın:**
```bash
docker-compose up -d --build
```
> Sistem ayağa kalktığında:
> - Frontend: `http://<SUNUCU_IP_ADRESI>:3000`
> - Backend API & Swagger: `http://<SUNUCU_IP_ADRESI>:8000/docs`
> - Canlı IoT WebSocket: `ws://<SUNUCU_IP_ADRESI>:8000/ws/live`

---

## 2. IoT Donanım Entegrasyonu (Load Cell / ESP32 Askılar)

Vitrindeki her bir altın tutan askı veya stant için:
- **Donanım:** HX711 Tartım Modülü + 100g / 500g Hassas Load Cell + ESP32 (veya ESP8266) Wi-Fi mikrodenetleyici.
- **Çalışma Prensibi:** Askıdaki ürünün ağırlığını 500ms aralıklarla ölçer. Ağırlıkta ±0.1g üzerinde bir sapma tespit ettiğinde sunucuya HTTP veya WebSocket ile veri basar.

### ESP32 / Arduino C++ Kod Örneği (Sensörden Veri Gönderme):

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "KUYUMCU_WIFI";
const char* password = "WIFI_PASSWORD";
const char* serverUrl = "http://<AWS_SUNUCU_IP>:8000/api/v1/iot/telemetry";

// HX711 ağırlık okuma fonksiyonu
float readWeightFromSensor() {
  // float grams = scale.get_units(5);
  return 14.55; 
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["device_id"] = "ESP32_LOADCELL_01";
    doc["slot_number"] = 1; // 1 numaralı vitrin askısı
    doc["weight_grams"] = readWeightFromSensor();

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    http.end();
  }
  delay(1000); // 1 saniyede bir veya ağırlık değiştikçe gönder
}
```

---

## 3. Sistem Güvenlik ve Alarm Mantığı

1. **Normal Bekleme:** Vitrin askısında ürün dururken ağırlık eşleşir (örn: 14.50g).
2. **Personel İnceleme Onayı:** Kuyumcu müşteriye ürünü göstermek istediğinde panelden **"İncelemeye Al"** butonuna basar veya barkodu okutur. Ürün kaldırıldığında alarm çalmaz; sistem **"İnceleme Sayacı (+1)"** ve müşterinin elinde kalma süresini analitik tablosuna işler.
3. **İzinsiz Kaldırma (Kayıp/Hırsızlık):** Onay verilmeden ağırlık sıfırlanırsa sistem 1 saniye içinde web arayüzünde:
   - Yanıp sönen **kırmızı acil durum afişi** çıkarır.
   - **Yüksek sesli siren (Buzzer)** çalar.
   - Hangi askıdan kaç gram eksildiğini kaydeder.
4. **Satış İşlemi:** Ürün satıldığında fatura kaydedilir, askı ağırlığı otomatik olarak sıfırlanır ve alarm devreye girmeden işlem tamamlanır.
