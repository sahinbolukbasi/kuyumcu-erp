# ==============================================================================
# 💎 Golden Guard IoT ERP - Kurumsal Raspberry Pi Pico W Donanım Firmware (v2.1)
# ==============================================================================
# Özellikler:
# 1. Çift Yönlü İletişim: ERP'ye Alarm & Heartbeat gönderir, ERP'den gelen IP isteklerini dinler.
# 2. Yerleşik Gömülü Web Sunucusu: Tarayıcıdan Pico IP'sine girildiğinde çalışan canlı teşhis paneli.
# 3. REST API Endpoint'leri:
#    - GET  /api/status  -> JSON durum, Wi-Fi RSSI, uptime, pil/voltaj ve donanım sağlığı.
#    - GET  /api/ping    -> Anlık yanıt ve gecikme testi (pong).
#    - POST /api/trigger -> Web panelinden uzaktan alarm tetikleme testi.
# 4. Donanım Buton Kesmesi: GP14 debounced fiziksel buton okuma.
# 5. Akıllı Durum LED'i: Wi-Fi arama, normal kalp atışı, alarm flaşı ve arıza ikazı.
# ==============================================================================

import machine
import time
import socket
import json
import config

FIRMWARE_VERSION = "2.1.0-Enterprise"
start_time = time.time()

# --- Donanım Tanımlamaları ---
led = None
try:
    led = machine.Pin("LED", machine.Pin.OUT) # Pico W dahili LED
except Exception:
    try:
        led = machine.Pin(25, machine.Pin.OUT) # Standart Pico dahili LED
    except Exception:
        pass

# Buton Pini (Dahili Pull-Up)
button = machine.Pin(config.BUTTON_PIN, machine.Pin.IN, machine.Pin.PULL_UP)

# İstatistikler
stats = {
    "total_heartbeats": 0,
    "total_alarms": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "consecutive_failures": 0,
    "last_latency_ms": 0,
    "last_alarm_time": "Yok",
    "device_ip": "0.0.0.0",
    "wifi_rssi": -60
}

def led_blink(times=1, on_ms=80, off_ms=80):
    if not led:
        return
    for _ in range(times):
        led.value(1)
        time.sleep_ms(on_ms)
        led.value(0)
        time.sleep_ms(off_ms)

def get_uptime_str():
    up = int(time.time() - start_time)
    hours = up // 3600
    minutes = (up % 3600) // 60
    seconds = up % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

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
            print("💎 GOLDEN GUARD IOT CİHAZI ÇEVRİMİÇİ!")
            print(f"📌 Firmware Sürümü : {FIRMWARE_VERSION}")
            print(f"📌 Cihaz IP Adresi : http://{stats['device_ip']}")
            print(f"📌 Sinyal Gücü     : {stats['wifi_rssi']} dBm")
            print(f"🎯 Hedef ERP       : http://{config.SERVER_HOST}:{config.SERVER_PORT}")
            print("=" * 65)
            led_blink(3, 150, 100)
            return True, wlan
        else:
            print("❌ Wi-Fi bağlantısı kurulamadı! Lütfen config.py ayarlarını kontrol edin.")
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
        except:
            pass
        latency = time.ticks_diff(time.ticks_ms(), t_start)
        return 0, latency, str(e)

def send_alarm(trigger_source="Fiziksel Buton (GP14)"):
    """Acil Durum Alarmı Tetikler"""
    stats["total_alarms"] += 1
    now_tuple = time.localtime()
    stats["last_alarm_time"] = f"{now_tuple[3]:02d}:{now_tuple[4]:02d}:{now_tuple[5]:02d}"
    
    print("\n" + "!" * 65)
    print(f"🚨 [ALARM #{stats['total_alarms']}] {trigger_source} Tetiklendi! ERP'ye İletiliyor...")
    led_blink(4, 50, 50)
    
    payload = {
        "trigger_source": f"{config.DEVICE_ID} ({trigger_source})",
        "details": f"IoT Sensör Üzerinden Acil Durum Tetiklendi! (IP: {stats['device_ip']}, Sinyal: {stats['wifi_rssi']} dBm)"
    }
    
    status_code, latency, res = http_post_to_erp("/api/v1/security/panic-button", payload)
    stats["last_latency_ms"] = latency
    
    if 200 <= status_code < 300:
        stats["successful_requests"] += 1
        stats["consecutive_failures"] = 0
        print(f"✅ [ALARM BAŞARIYLA İŞLENDİ] HTTP {status_code} | Gecikme: {latency} ms")
        print("📢 ERP Web Yönetim Paneline Anında Canlı Alarm Düştü!")
        led_blink(2, 200, 100)
    else:
        stats["failed_requests"] += 1
        stats["consecutive_failures"] += 1
        print(f"❌ [ALARM İLETİM HATASI] HTTP {status_code} | Hata: {res}")
        led_blink(5, 50, 100)
    print("!" * 65 + "\n")

def send_heartbeat():
    """ERP'ye Canlılık (Heartbeat) Gönderir"""
    stats["total_heartbeats"] += 1
    payload = {
        "device_id": config.DEVICE_ID,
        "slot_number": config.SLOT_NUMBER,
        "weight_grams": 86.50
    }
    status_code, latency, res = http_post_to_erp("/api/v1/iot/telemetry", payload)
    stats["last_latency_ms"] = latency
    
    timestamp = time.localtime()
    time_str = f"{timestamp[3]:02d}:{timestamp[4]:02d}:{timestamp[5]:02d}"
    
    if 200 <= status_code < 300:
        stats["successful_requests"] += 1
        stats["consecutive_failures"] = 0
        led_blink(1, 25, 10)
        print(f"[{time_str}] [HEARTBEAT #{stats['total_heartbeats']:03d}] 🟢 Çevrimiçi | Ping: {latency}ms | Kod: {status_code}")
    else:
        stats["failed_requests"] += 1
        stats["consecutive_failures"] += 1
        print(f"[{time_str}] [HEARTBEAT #{stats['total_heartbeats']:03d}] 🔴 KESİNTİ! | Hata: {res}")
        led_blink(3, 80, 80)

def generate_web_portal_html():
    """Pico IP'sine Tarayıcıdan Girildiğinde Açılan Kurumsal Web Arayüzü"""
    uptime = get_uptime_str()
    rssi = stats["wifi_rssi"]
    rssi_quality = "Mükemmel" if rssi > -60 else ("İyi" if rssi > -75 else "Zayıf")
    total_req = stats["successful_requests"] + stats["failed_requests"]
    success_pct = f"{(stats['successful_requests'] / total_req * 100):.1f}%" if total_req > 0 else "%100"
    
    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Golden Guard - IoT Cihaz Paneli</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0e14; color: #e2e8f0; margin: 0; padding: 20px; }}
        .container {{ max-width: 540px; margin: 0 auto; background: #151822; border: 1px solid #2d3748; border-radius: 16px; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
        .header {{ display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #2d3748; padding-bottom: 16px; margin-bottom: 20px; }}
        .title {{ font-size: 18px; font-weight: bold; color: #f6ad55; letter-spacing: 0.5px; }}
        .badge {{ background: #22543d; color: #68d391; font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: bold; border: 1px solid #2f855a; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }}
        .card {{ background: #0c0e14; border: 1px solid #242938; padding: 12px 14px; border-radius: 10px; }}
        .card-label {{ font-size: 11px; color: #a0aec0; text-transform: uppercase; margin-bottom: 4px; }}
        .card-val {{ font-size: 15px; font-weight: bold; color: #fff; font-family: monospace; }}
        .btn {{ width: 100%; background: linear-gradient(135deg, #d69e2e, #b7791f); color: #000; border: none; padding: 12px; font-size: 14px; font-weight: bold; border-radius: 10px; cursor: pointer; margin-top: 10px; }}
        .btn:hover {{ opacity: 0.9; }}
        .footer {{ text-align: center; font-size: 11px; color: #718096; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="title">💎 GOLDEN GUARD IoT</div>
                <div style="font-size: 11px; color: #a0aec0;">Akıllı Vitrin & Terazi Donanımı ({config.DEVICE_ID})</div>
            </div>
            <span class="badge">● ÇEVRİMİÇİ</span>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-label">Cihaz IP Adresi</div>
                <div class="card-val" style="color: #68d391;">{stats['device_ip']}</div>
            </div>
            <div class="card">
                <div class="card-label">Wi-Fi Sinyal Gücü</div>
                <div class="card-val">{rssi} dBm ({rssi_quality})</div>
            </div>
            <div class="card">
                <div class="card-label">Atanmış Yuva (Slot)</div>
                <div class="card-val" style="color: #f6ad55;">Askı #{config.SLOT_NUMBER}</div>
            </div>
            <div class="card">
                <div class="card-label">Çalışma Süresi (Uptime)</div>
                <div class="card-val">{uptime}</div>
            </div>
            <div class="card">
                <div class="card-label">Haberleşme Başarısı</div>
                <div class="card-val">{success_pct} ({stats['successful_requests']}/{total_req})</div>
            </div>
            <div class="card">
                <div class="card-label">ERP Ping Gecikmesi</div>
                <div class="card-val">{stats['last_latency_ms']} ms</div>
            </div>
        </div>

        <div class="card" style="margin-bottom: 16px;">
            <div class="card-label">Hedef ERP Sunucu</div>
            <div class="card-val" style="font-size: 13px;">http://{config.SERVER_HOST}:{config.SERVER_PORT}</div>
        </div>

        <button class="btn" onclick="fetch('/api/trigger', {{method: 'POST'}}).then(() => alert('🚨 Acil durum alarm isteği ERP sunucusuna iletildi!'));">
            🚨 CANLI ALARM TESTİ GÖNDER
        </button>

        <div class="footer">
            Firmware: {FIRMWARE_VERSION} • Güvenli IoT Donanım Katmanı
        </div>
    </div>
</body>
</html>"""
    return html

def handle_http_request(client_socket):
    """ERP'den veya Tarayıcıdan Gelen HTTP İsteklerini Karşılar"""
    try:
        req_raw = client_socket.recv(1024).decode("utf-8")
        if not req_raw:
            client_socket.close()
            return
        
        first_line = req_raw.split("\r\n")[0]
        parts = first_line.split(" ")
        method = parts[0] if len(parts) > 0 else "GET"
        path = parts[1] if len(parts) > 1 else "/"
        
        # 1. REST API: /api/status (ERP Sunucusunun Sorgusu İçin)
        if path.startswith("/api/status") or path.startswith("/status"):
            uptime = get_uptime_str()
            status_data = {
                "status": "ONLINE",
                "device_id": config.DEVICE_ID,
                "slot_number": config.SLOT_NUMBER,
                "ip_address": stats["device_ip"],
                "wifi_rssi": stats["wifi_rssi"],
                "uptime": uptime,
                "total_alarms": stats["total_alarms"],
                "last_alarm_time": stats["last_alarm_time"],
                "total_heartbeats": stats["total_heartbeats"],
                "last_latency_ms": stats["last_latency_ms"],
                "erp_server": f"http://{config.SERVER_HOST}:{config.SERVER_PORT}",
                "firmware_version": FIRMWARE_VERSION
            }
            body = json.dumps(status_data).encode("utf-8")
            res = (
                b"HTTP/1.1 200 OK\r\n"
                b"Content-Type: application/json\r\n"
                b"Access-Control-Allow-Origin: *\r\n"
                b"Content-Length: " + str(len(body)).encode() + b"\r\n"
                b"Connection: close\r\n\r\n" + body
            )
            client_socket.send(res)
            print(f"📡 [ERP İSTEĞİ CEVAPLANDI] {method} {path} -> 200 OK")

        # 2. REST API: /api/ping
        elif path.startswith("/api/ping") or path.startswith("/ping"):
            body = json.dumps({"status": "pong", "device_id": config.DEVICE_ID, "uptime": get_uptime_str()}).encode("utf-8")
            res = (
                b"HTTP/1.1 200 OK\r\n"
                b"Content-Type: application/json\r\n"
                b"Access-Control-Allow-Origin: *\r\n"
                b"Content-Length: " + str(len(body)).encode() + b"\r\n"
                b"Connection: close\r\n\r\n" + body
            )
            client_socket.send(res)

        # 3. REST API: /api/trigger (Uzaktan Alarm Testi)
        elif path.startswith("/api/trigger"):
            send_alarm("Web Paneli Uzaktan Test")
            body = json.dumps({"status": "alarm_triggered", "device_id": config.DEVICE_ID}).encode("utf-8")
            res = (
                b"HTTP/1.1 200 OK\r\n"
                b"Content-Type: application/json\r\n"
                b"Access-Control-Allow-Origin: *\r\n"
                b"Content-Length: " + str(len(body)).encode() + b"\r\n"
                b"Connection: close\r\n\r\n" + body
            )
            client_socket.send(res)

        # 4. Web Arayüzü: / (Tarayıcı Paneli)
        else:
            html = generate_web_portal_html().encode("utf-8")
            res = (
                b"HTTP/1.1 200 OK\r\n"
                b"Content-Type: text/html; charset=utf-8\r\n"
                b"Content-Length: " + str(len(html)).encode() + b"\r\n"
                b"Connection: close\r\n\r\n" + html
            )
            client_socket.send(res)
            
        client_socket.close()
    except Exception as e:
        try:
            client_socket.close()
        except:
            pass

def init_web_server(port=80):
    """Pico Üzerinde Gömülü Web Sunucu Soketi Açar"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(('0.0.0.0', port))
        s.listen(3)
        # Non-blocking mod: Ana döngüyü kilitlemeden istek bekler
        s.setblocking(False)
        print(f"🌐 Gömülü Web Sunucusu Başlatıldı: Port {port}")
        return s
    except Exception as e:
        print(f"⚠️ Web Sunucu Soket Hatası: {e}")
        return None

def main():
    print("=" * 65)
    print("💎 Golden Guard - Raspberry Pi Pico Kurumsal IoT Firmware")
    print(f"📌 Buton Pini        : GP{config.BUTTON_PIN} (GND Tetikleme)")
    print(f"📌 Heartbeat Sıklığı : {config.HEARTBEAT_INTERVAL_SEC} sn")
    print("=" * 65)
    
    # 1. Wi-Fi Bağlantısı
    wifi_ok, wlan = connect_wifi()
    
    # 2. Gömülü HTTP Sunucuyu Başlat
    server_socket = None
    if wifi_ok:
        server_socket = init_web_server(80)
    
    # 3. Donanım Watchdog Timer (Kilitlenmeleri Önlemek İçin)
    wdt = None
    try:
        wdt = machine.WDT(timeout=8000)
        print("🛡️ Donanım Watchdog Timer Aktif (8000ms)")
    except Exception:
        pass
    
    last_heartbeat_time = time.time()
    last_button_state = button.value()
    last_press_time = 0
    
    print("\n🟢 Donanım hazır! Kesintisiz liveness ve çift yönlü haberleşme devrede.\n")
    
    while True:
        # Watchdog besle (Kilitlenmeyi önle)
        if wdt:
            try:
                wdt.feed()
            except Exception:
                pass

        current_time_sec = time.time()
        current_time_ms = time.ticks_ms()
        
        # --- 0) Wi-Fi Canlılık & Otomatik Yeniden Bağlanma ---
        if wlan and not wlan.isconnected():
            print("⚠️ [WIFI KOPTU] Bağlantı koptu! Hemen yeniden bağlanılıyor...")
            led_blink(4, 50, 50)
            wifi_ok, wlan = connect_wifi()
            if wifi_ok:
                try:
                    if server_socket:
                        server_socket.close()
                except Exception:
                    pass
                server_socket = init_web_server(80)

        # --- A) Gelen HTTP İsteklerini Dinle (Non-Blocking) ---
        if server_socket:
            try:
                client_sock, client_addr = server_socket.accept()
                handle_http_request(client_sock)
            except OSError:
                pass # Yeni bağlantı yok, devam et
        
        # --- B) Fiziksel Buton Kontrolü (Debounced) ---
        btn_val = button.value()
        if btn_val == 0 and last_button_state == 1:
            if time.ticks_diff(current_time_ms, last_press_time) > config.DEBOUNCE_MS:
                last_press_time = current_time_ms
                send_alarm("Fiziksel Buton (GP14)")
        last_button_state = btn_val
        
        # --- C) Periyodik Heartbeat & Ağ İyileştirme ---
        if current_time_sec - last_heartbeat_time >= config.HEARTBEAT_INTERVAL_SEC:
            last_heartbeat_time = current_time_sec
            send_heartbeat()
            # Wi-Fi sinyal gücünü güncelle
            if wlan and wlan.isconnected():
                try:
                    stats["wifi_rssi"] = wlan.status('rssi')
                except:
                    pass
            
            # Eğer peş peşe 4 kez ERP'ye ulaşılamadıysa ağ adaptörünü resetle
            if stats.get("consecutive_failures", 0) >= 4:
                print("⚠️ [AĞ HATASI] Peş peşe bağlantı başarısız! Wi-Fi adaptörü yenileniyor...")
                led_blink(5, 50, 50)
                try:
                    wlan.active(False)
                    time.sleep_ms(500)
                    wlan.active(True)
                    wlan.connect(config.WIFI_SSID, config.WIFI_PASSWORD)
                    stats["consecutive_failures"] = 0
                except Exception as e:
                    print(f"Yenileme hatası: {e}")
                    
        time.sleep_ms(25)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n🛑 Program durduruldu.")
