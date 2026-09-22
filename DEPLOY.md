# 💎 Golden Guard IoT ERP - Terraform & GitHub Actions Kurulum Kılavuzu

## 📋 İçindekiler
- [Terraform ile AWS Altyapısı](#-terraform-ile-aws-altyapsı)
- [GitHub Actions ile CI/CD](#-github-actions-ile-cicd)
- [İlk Kurulum Adımları](#-ilk-kurulum-adımları)
- [GitHub Secrets Ayarları](#-github-secrets-ayarları)
- [Yerel Geliştirme](#-yerel-geliştirme)

---

## 🏗️ Terraform ile AWS Altyapısı

`infra/terraform/` dizini AWS'de aşağıdaki kaynakları oluşturur:

| Kaynak | Tip | Açıklama |
|--------|-----|----------|
| **EC2** | `t4g.micro` | ARM64, 1GB RAM, Free Tier uyumlu (~$3-5/ay) |
| **Security Group** | Firewall | 80, 443, 3000, 8000, 22 portları açık |
| **Elastic IP** | Statik IP | Sunucu yeniden başlatılsa bile IP değişmez |
| **Route53** | DNS Kaydı | `goldenguard.uk` ve `api.goldenguard.uk` |
| **Root Disk** | 20GB gp3 | AES-256 şifreli SSD |

### Terraform Komutları

```bash
# 1. Terraform'u başlat (backend state için)
cd infra/terraform
terraform init

# 2. Değişiklikleri önizle
terraform plan

# 3. Altyapıyı oluştur
terraform apply -auto-approve

# 4. Sunucu bilgilerini gör
terraform output

# 5. Altyapıyı yok et (opsiyonel)
terraform destroy
```

### AWS Credentials

Terraform'un AWS'ye bağlanması için aşağıdaki ortam değişkenleri gerekli:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
```

Veya `~/.aws/credentials` dosyası:

```ini
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = ...
```

### EC2 Key Pair

Terraform `kuyumcu-key` adlı bir EC2 Key Pair kullanır. Oluşturmak için:

```bash
aws ec2 create-key-pair --key-name kuyumcu-key --query 'KeyMaterial' --output text > ~/.ssh/kuyumcu-key.pem
chmod 400 ~/.ssh/kuyumcu-key.pem
```

---

## 🔄 GitHub Actions ile CI/CD

Pipeline 3 aşamadan oluşur:

### 1. Backend Lint (`flake8`)
- Python 3.11'de kod kalitesi kontrolü
- `backend/app/` dizinindeki tüm Python dosyaları taranır

### 2. Frontend Build (`npm run build`)
- Node.js 20'de Next.js build
- `NEXT_PUBLIC_API_URL` ortam değişkeni ile API adresi ayarlanır

### 3. Deploy to AWS EC2
- `rsync` ile proje dosyaları sunucuya kopyalanır
- `docker compose down && docker compose up -d --build` ile yeniden başlatılır
- Health check ile frontend ve backend doğrulanır

### Pipeline'ı Tetikleme

```bash
# main branch'ine push yapınca otomatik tetiklenir
git push origin main

# GitHub Actions UI'dan manuel tetikleme
# -> Actions -> Deploy to Production -> Run workflow
```

---

## 🚀 İlk Kurulum Adımları

### Adım 1: Terraform ile Sunucuyu Oluşturun

```bash
cd infra/terraform
terraform init
terraform apply -auto-approve
```

### Adım 2: SSH Bağlantısını Test Edin

```bash
ssh -i ~/.ssh/kuyumcu-key.pem ubuntu@$(terraform output -raw public_ip)
```

### Adım 3: Projeyi Sunucuya Kopyalayın

```bash
rsync -avz --delete -e "ssh -i ~/.ssh/kuyumcu-key.pem" \
  --exclude '.git' --exclude 'node_modules' --exclude '.next' \
  --exclude '__pycache__' --exclude '*.pyc' --exclude '.venv' \
  --exclude 'backend/venv' --exclude 'data' --exclude 'uploads' \
  ./ ubuntu@$(terraform output -raw public_ip):/opt/kuyumculuk/
```

### Adım 4: Docker ile Başlatın

```bash
ssh -i ~/.ssh/kuyumcu-key.pem ubuntu@$(terraform output -raw public_ip)
cd /opt/kuyumculuk
export MASTER_PASSWORD_HASH="pbkdf2_sha256\$600000\$..."
sudo docker compose up -d --build
```

### Adım 5: GitHub Secrets Ayarlayın

Repository ayarlarına gidin: `Settings > Secrets and variables > Actions`

Aşağıdaki secret'ları ekleyin:

---

## 🔐 GitHub Secrets Ayarları

| Secret | Değer | Açıklama |
|--------|-------|----------|
| `AWS_INSTANCE_IP` | `63.181.78.45` | Sunucu public IP'si |
| `SSH_PRIVATE_KEY` | `-----BEGIN RSA PRIVATE KEY-----...` | `~/.ssh/kuyumcu-key.pem` içeriği |
| `MASTER_PASSWORD_HASH` | `pbkdf2_sha256$600000$...` | Master HQ şifre hash'i |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | AWS API anahtarı (Terraform için) |
| `AWS_SECRET_ACCESS_KEY` | `...` | AWS API secret (Terraform için) |

### MASTER_PASSWORD_HASH Oluşturma

```bash
python3 -c "
import hashlib, secrets
password = 'GG-MASTER-HQ-2026'  # Kendi şifrenizi yazın
salt = secrets.token_hex(16)
digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 600000).hex()
print(f'pbkdf2_sha256\\\$600000\\\${salt}\\\${digest}')
"
```

### SSH Private Key Formatı

```bash
cat ~/.ssh/kuyumcu-key.pem
# Çıktının tamamını SSH_PRIVATE_KEY secret'ına yapıştırın
```

---

## 🐳 Docker Compose ile Çalıştırma

```bash
# Build ve başlat
sudo docker compose up -d --build

# Logları izle
sudo docker compose logs -f

# Sadece backend logları
sudo docker compose logs -f backend

# Sadece frontend logları
sudo docker compose logs -f frontend

# Yeniden başlat
sudo docker compose restart

# Durdur
sudo docker compose down
```

---

## 📝 Proje Yapısı

```
kuyumculuk/
├── .github/workflows/
│   ├── deploy.yml          # CI/CD pipeline
│   └── terraform.yml       # Terraform pipeline
├── infra/terraform/
│   ├── main.tf             # Ana Terraform konfigürasyonu
│   ├── variables.tf        # Değişkenler
│   ├── outputs.tf          # Çıktılar
│   ├── user_data.sh        # EC2 bootstrap script
│   └── .gitignore
├── docker-compose.yml      # Docker Compose (prod)
├── backend/                # Python FastAPI backend
├── frontend/               # Next.js frontend
└── hardware/               # Pico W IoT firmware
```

---

## 💰 Tahmini Aylık Maliyet

| Kaynak | Maliyet |
|--------|---------|
| EC2 t4g.micro (1GB RAM) | ~$3.50/ay |
| Elastic IP | ~$3.60/ay |
| EBS gp3 20GB | ~$0.60/ay |
| **Toplam** | **~$7-8/ay** |

> Free Tier kapsamında ilk 12 ay: t4g.micro ücretsiz, EBS 30GB ücretsiz.

---

## 🔧 Yerel Geliştirme

```bash
# Backend
source .venv/bin/activate
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# Frontend
cd frontend && npm run dev

# Tarayıcı
open http://localhost:3000
```