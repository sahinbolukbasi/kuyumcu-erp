# 💎 Sarraf Erdem IoT ERP - Raspberry Pi Pico Donanım Modülü

Bu modül, **Raspberry Pi Pico (MicroPython)** ile kuyumculuk ERP sistemimiz arasındaki canlı haberleşmeyi, fiziksel butonla alarm tetiklemeyi ve ağdaki olası kesintileri (paket kaybı, zaman aşımı, gecikme) anlık olarak takip etmeyi sağlar.

---

## 📂 Klasör Yapısı

```bash
hardware/
└── pico/
    ├── config.py           # Wi-Fi ve ERP Sunucu IP yapılandırması
    ├── main.py             # Pico üzerinde çalışan MicroPython ana kodu
    └── test_simulator.py   # Pico olmadan bilgisayardan testi çalıştırma simülatörü
```

---

## 🛠️ 1. Donanım Gereksinimleri & Bağlantı Şeması (Wiring)

| Parça | Açıklama |
|---|---|
| **Raspberry Pi Pico / Pico W** | MicroPython yüklü geliştirme kartı (Pico W önerilir) |
| **Push Buton** | 2 bacaklı standart dokunmatik buton |
| **2x Jumper Kablo** | Erkek-Dişi veya Erkek-Erkek |

### 🔌 Pin Bağlantısı

Pico'nun dahili **Pull-Up direnci** kod içerisinde aktif edilmiştir; harici dirence gerek yoktur:

```
Raspberry Pi Pico          Fiziksel Buton
-----------------          --------------
Pin 19 (GP14)    ------->  Butonun 1. Bacağı
Pin 18 (GND)     ------->  Butonun 2. Bacağı
```

> 💡 **İpucu:** Butona basıldığında GP14 pini GND'ye çekilerek sinyal (0V / LOW) üretir ve MicroPython anında alarm fonksiyonunu ateşler.

---

## 🚀 2. Kurulum ve Yükleme Adımları

### Adım 1: Pico'ya MicroPython Kurulumu (İlk kez yapıyorsanız)
1. Pico üzerindeki **BOOTSEL** butonuna basılı tutarak USB kablosuyla bilgisayara bağlayın.
2. Bilgisayarınızda `RPI-RP2` adında bir flash sürücü belirecektir.
3. [MicroPython Resmi Sitesinden](https://micropython.org/download/rp2-pico-w/) Pico W için en güncel `.uf2` dosyasını indirip bu sürücüye sürükleyin. Pico otomatik yeniden başlayacaktır.

### Adım 2: Thonny IDE Kurulumu
1. [Thonny Python IDE](https://thonny.org/)'yi açın.
2. Sağ alttan yorumlayıcıyı **MicroPython (Raspberry Pi Pico)** olarak seçin.

### Adım 3: Yapılandırma (`config.py`)
`hardware/pico/config.py` dosyasını açıp kendi ortamınıza göre güncelleyin:

```python
WIFI_SSID = "EV_VEYA_OFIS_WIFI_ADI"
WIFI_PASSWORD = "WIFI_SIFRENIZ"

# Bilgisayarınızın yerel ağdaki IP adresini yazın (Terminalde 'ipconfig' veya 'ifconfig')
SERVER_HOST = "192.168.1.100"
SERVER_PORT = 8000
```

### Adım 4: Dosyaları Pico'ya Kopyalama
Thonny IDE üzerinden:
1. `config.py` ve `main.py` dosyalarını Pico'nun hafızasına kaydedin (`Raspberry Pi Pico` kök dizinine).
2. Yeşil **Çalıştır (Run)** butonuna basın.

---

## 📡 3. Haberleşme & Kesinti Takip Özellikleri

Pico çalıştığında ekranda ve dahili LED'de aşağıdaki durumları canlı izleyebilirsiniz:

1. **Kalp Atışı (Heartbeat / Canlılık Sinyali):**
   - Pico her 5 saniyede bir ERP sunucusuna canlılık telemetrisi gönderir.
   - Her istekte **Gecikme Süresi (ms)**, **HTTP Durum Kodu** ve **Paket Kaybı** hesaplanır.
2. **LED Durum Göstergesi:**
   - **Wi-Fi Aranıyor:** Hızlı aralıklarla yanıp sönme.
   - **Haberleşme Kararlı:** Her 5 saniyede bir hafif göz kırpma (Heartbeat nabzı).
   - **🚨 Alarm Tetiklendi:** Hızlı ve parlak stroboskopik flaş!
   - **🔴 Kesinti Var:** Sunucuya ulaşılamazsa seri hata flaşı.
3. **Canlı İstatistik Raporu:**
   - Konsolda her 10 pakette bir veya butona basıldığında iletilen toplam paket, başarı yüzdesi (`%100`) ve kesinti adedi listelenir.

---

## 💻 4. Pico Olmadan PC'den Test (Yazılım Simülatörü)

Eğer elinizde o an fiziksel Pico yoksa veya haberleşmeyi hemen bilgisayarınızda denemek isterseniz:

```bash
python3 hardware/pico/test_simulator.py
```

- Konsolda periyodik **Heartbeat** akmaya başlar.
- Klavyeden **`a`** yazıp `Enter`a bastığınızda anında canlı alarm ERP sistemine gönderilir ve web paneline siren/kırmızı uyarı düşer.
- Sunucuyu durdurduğunuzda simülatör kesintiyi anında kırmızı olarak raporlar.
