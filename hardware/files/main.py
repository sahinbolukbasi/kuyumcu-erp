# ==============================================================================
# 💎 Golden Guard IoT ERP - ESP8266 + HX711 (20kg) Ağırlık Sensörü Firmware
# ==============================================================================
# Özellikler:
# 1. Wi-Fi'a bağlanır, kopmalarda otomatik yeniden bağlanır.
# 2. HX711 üzerinden 20 kg yük hücresini periyodik olarak okur.
# 3. Ölçülen ağırlığı ERP sunucusuna POST /api/v1/iot/telemetry ile gönderir.
# 4. Açılışta otomatik dara (tare) alır - üzerinde bir şey yokken başlatın!
# ==============================================================================

import time
import socket
import json
import machine
import config
from hx711 import HX711

FIRMWARE_VERSION = "1.0.0-ESP8266-HX711"
start_time = time.time()

# --- Dahili LED (ESP8266'da genelde GPIO2, mantık TERS: 0=Açık, 1=Kapalı) ---
try:
    led = machine.Pin(2, machine.Pin.OUT)
    led.value(1)  # Başlangıçta kapalı
except Exception:
    led = None

stats = {
    "device_ip": "0.0.0.0",
    "wifi_rssi": -60,
    "total_sends": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "consecutive_failures": 0,
    "last_weight_g": 0.0,
    "last_latency_ms": 0,
}


def led_blink(times=1, on_ms=80, off_ms=80):
    if not led:
        return
    for _ in range(times):
        led.value(0)  # ESP8266 dahili LED'i ters mantık: 0 = yanık
        time.sleep_ms(on_ms)
        led.value(1)
        time.sleep_ms(off_ms)


def connect_wifi():
    """Wi-Fi Ağına Bağlanma"""
    global stats
    try:
        import network
        wlan = network.WLAN(network.STA_IF)
        wlan.active(True)
        if not wlan.isconnected():
            print(f"\n📡 Wi-Fi'a bağlanılıyor: {config.WIFI_SSID}...")
            wlan.connect(config.WIFI_SSID, config.WIFI_PASSWORD)

            timeout = 15
            while not wlan.isconnected() and timeout > 0:
                led_blink(1, 80, 80)
                time.sleep(0.8)
                timeout -= 1
                print(".", end="")
            print("")

        if wlan.isconnected():
            ip_info = wlan.ifconfig()
            stats["device_ip"] = ip_info[0]
            try:
                stats["wifi_rssi"] = wlan.status('rssi')
            except Exception:
                stats["wifi_rssi"] = -55

            print("=" * 65)
            print("💎 ESP8266 AĞIRLIK SENSÖRÜ ÇEVRİMİÇİ!")
            print(f"📌 Firmware        : {FIRMWARE_VERSION}")
            print(f"📌 Cihaz IP Adresi : http://{stats['device_ip']}")
            print(f"📌 Sinyal Gücü     : {stats['wifi_rssi']} dBm")
            print(f"🎯 Hedef ERP       : http://{config.SERVER_HOST}:{config.SERVER_PORT}")
            print("=" * 65)
            led_blink(3, 150, 100)
            return True, wlan
        else:
            print("❌ Wi-Fi bağlantısı kurulamadı! config.py ayarlarını kontrol edin.")
            return False, None
    except Exception as e:
        print(f"❌ Wi-Fi Hatası: {e}")
        return False, None


def http_post_to_erp(path, json_data):
    """ERP Sunucusuna HTTP POST İsteği Gönderir"""
    t_start = time.ticks_ms()
    s = socket.socket()
    s.settimeout(config.REQUEST_TIMEOUT_SEC)
    try:
        addr = socket.getaddrinfo(config.SERVER_HOST, config.SERVER_PORT)[0][-1]
        s.connect(addr)

        body_bytes = json.dumps(json_data).encode("utf-8")
        headers = (
            f"POST {path} HTTP/1.1\r\n"
            f"Host: {config.SERVER_HOST}:{config.SERVER_PORT}\r\n"
            f"Content-Type: application/json\r\n"
            f"Content-Length: {len(body_bytes)}\r\n"
            f"Connection: close\r\n\r\n"
        ).encode("utf-8")

        s.send(headers + body_bytes)
        response = s.recv(1024).decode("utf-8")
        s.close()

        latency = time.ticks_diff(time.ticks_ms(), t_start)
        first_line = response.split("\r\n")[0]
        status_code = int(first_line.split(" ")[1]) if " " in first_line else 0
        return status_code, latency, response
    except Exception as e:
        try:
            s.close()
        except Exception:
            pass
        latency = time.ticks_diff(time.ticks_ms(), t_start)
        return 0, latency, str(e)


def send_weight_telemetry(weight_g):
    """Ölçülen ağırlığı ERP'ye gönderir"""
    stats["total_sends"] += 1
    payload = {
        "device_id": config.DEVICE_ID,
        "slot_number": config.SLOT_NUMBER,
        "weight_grams": round(weight_g, 2)
    }
    status_code, latency, res = http_post_to_erp(config.TELEMETRY_PATH, payload)
    stats["last_latency_ms"] = latency

    timestamp = time.localtime()
    time_str = f"{timestamp[3]:02d}:{timestamp[4]:02d}:{timestamp[5]:02d}"

    if 200 <= status_code < 300:
        stats["successful_requests"] += 1
        stats["consecutive_failures"] = 0
        led_blink(1, 25, 10)
        print(f"[{time_str}] ✅ Gönderildi | Ağırlık: {weight_g:.1f} g | Ping: {latency}ms | Kod: {status_code}")
    else:
        stats["failed_requests"] += 1
        stats["consecutive_failures"] += 1
        print(f"[{time_str}] 🔴 GÖNDERİM HATASI! | Hata: {res}")
        led_blink(3, 80, 80)


def main():
    print("=" * 65)
    print("💎 ESP8266 + HX711 (20kg) Ağırlık Sensörü Firmware")
    print(f"📌 HX711 DOUT (D2) : GPIO{config.HX711_DOUT_PIN}")
    print(f"📌 HX711 SCK  (D1) : GPIO{config.HX711_SCK_PIN}")
    print(f"📌 Gönderim Sıklığı: {config.SEND_INTERVAL_SEC} sn")
    print("=" * 65)

    # 1) HX711'i başlat
    print("\n⚖️  HX711 başlatılıyor...")
    hx = HX711(dout_pin=config.HX711_DOUT_PIN, sck_pin=config.HX711_SCK_PIN)
    hx.set_scale(config.CALIBRATION_FACTOR)

    print("⚖️  Dara alınıyor... TERAZİNİN ÜZERİNDE HİÇBİR ŞEY OLMADIĞINDAN EMİN OLUN!")
    time.sleep(1)
    hx.tare(times=20)
    print(f"✅ Dara tamamlandı. Ofset: {hx.OFFSET:.0f}\n")

    # 2) Wi-Fi bağlantısı
    wifi_ok, wlan = connect_wifi()

    last_send_time = time.time()
    last_sent_weight = None

    print("\n🟢 Sistem hazır! Ağırlık ölçümü ve ERP gönderimi başladı.\n")

    while True:
        current_time_sec = time.time()

        # --- Wi-Fi koptu mu? Otomatik yeniden bağlan ---
        if wlan and not wlan.isconnected():
            print("⚠️ [WIFI KOPTU] Yeniden bağlanılıyor...")
            led_blink(4, 50, 50)
            wifi_ok, wlan = connect_wifi()

        # --- Ağırlığı oku ---
        try:
            weight_g = hx.get_units(times=config.READ_SAMPLES)
            # Küçük negatif sapmaları (gürültü) sıfırla
            if -1.0 < weight_g < 0:
                weight_g = 0.0
            stats["last_weight_g"] = weight_g
        except OSError as e:
            print(f"❌ HX711 okuma hatası: {e} (kablo bağlantısını kontrol edin)")
            time.sleep(1)
            continue

        # --- Periyodik gönderim (isteğe bağlı: sadece değişiklik varsa gönder) ---
        weight_changed = (
            last_sent_weight is None
            or abs(weight_g - last_sent_weight) >= config.MIN_CHANGE_TO_SEND_G
        )
        time_to_send = (current_time_sec - last_send_time) >= config.SEND_INTERVAL_SEC

        if time_to_send and weight_changed:
            last_send_time = current_time_sec
            last_sent_weight = weight_g
            send_weight_telemetry(weight_g)
        elif time_to_send:
            # Değişiklik yoksa da periyodik olarak canlılık için gönder
            last_send_time = current_time_sec
            send_weight_telemetry(weight_g)

        time.sleep_ms(200)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Program durduruldu.")
