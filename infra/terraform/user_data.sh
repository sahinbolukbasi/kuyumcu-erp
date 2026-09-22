#!/bin/bash
set -e

echo "💎 Golden Guard IoT ERP - AWS Bootstrap"
echo "Proje: ${project_name}"
echo "Domain: ${domain_name}"

# Swap alanı (1GB RAM için kritik)
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "✅ Swap alanı oluşturuldu (1GB)"
fi

# Sistem güncelleme
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq ca-certificates curl git

# Docker kurulumu
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=arm64 signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  usermod -aG docker ubuntu
  echo "✅ Docker kuruldu"
fi

# Docker servisini başlat
systemctl enable docker
systemctl start docker

# Proje dizini
mkdir -p /opt/${project_name}
echo "✅ /opt/${project_name} hazır"

# GitHub Actions runner'ın deploy yapabilmesi için dizin izinleri
chown -R ubuntu:ubuntu /opt/${project_name}

# Log
echo "✅ Bootstrap tamamlandı!"
echo "📌 SSH: ssh -i ~/.ssh/kuyumcu-key.pem ubuntu@$(curl -s http://checkip.amazonaws.com)"