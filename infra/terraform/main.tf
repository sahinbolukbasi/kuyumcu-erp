# ==============================================================================
# 💎 Golden Guard IoT ERP - AWS Terraform Altyapısı
# ==============================================================================
# Bu Terraform konfigürasyonu şunları oluşturur:
# 1. AWS EC2 t4g.micro (Free Tier uyumlu, ARM64, 1GB RAM)
# 2. Security Group (80, 443, 3000, 8000)
# 3. Elastic IP (statik IP)
# 4. Route53 DNS kaydı (goldenguard.uk)
# 5. Swap alanı ve Docker kurulumu (user_data)
# ==============================================================================

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # State dosyası için S3 backend (opsiyonel)
  # backend "s3" {
  #   bucket = "kuyumculuk-terraform-state"
  #   key    = "infra/terraform.tfstate"
  #   region = "eu-west-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

# =============================================================================
# VARIABLES
# =============================================================================

variable "aws_region" {
  description = "AWS bölgesi"
  type        = string
  default     = "eu-west-1" # İrlanda - en düşük gecikme
}

variable "project_name" {
  description = "Proje adı"
  type        = string
  default     = "kuyumculuk"
}

variable "domain_name" {
  description = "Domain adı"
  type        = string
  default     = "goldenguard.uk"
}

variable "ssh_key_name" {
  description = "AWS EC2 Key Pair adı (~/.ssh/kuyumcu-key.pem)"
  type        = string
  default     = "kuyumcu-key"
}

# =============================================================================
# SECURITY GROUP
# =============================================================================

resource "aws_security_group" "main" {
  name        = "${var.project_name}-sg"
  description = "Golden Guard ERP - IoT Security Group"
  vpc_id      = data.aws_vpc.default.id

  tags = {
    Name    = "${var.project_name}-sg"
    Project = var.project_name
  }
}

# HTTP (80) - IoT cihazları için
resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.main.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  ip_protocol       = "tcp"
  to_port           = 80
  description       = "HTTP - IoT cihaz trafiği"
}

# HTTPS (443) - SSL
resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.main.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
  description       = "HTTPS - SSL trafiği"
}

# Frontend (3000)
resource "aws_vpc_security_group_ingress_rule" "frontend" {
  security_group_id = aws_security_group.main.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 3000
  ip_protocol       = "tcp"
  to_port           = 3000
  description       = "Next.js Frontend"
}

# Backend API (8000)
resource "aws_vpc_security_group_ingress_rule" "backend" {
  security_group_id = aws_security_group.main.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 8000
  ip_protocol       = "tcp"
  to_port           = 8000
  description       = "FastAPI Backend & Swagger"
}

# SSH (22) - sadece güvenli kaynaklardan
resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.main.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 22
  ip_protocol       = "tcp"
  to_port           = 22
  description       = "SSH"
}

# Tüm çıkış trafiği
resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.main.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 0
  ip_protocol       = "-1"
  to_port           = 0
  description       = "Tüm çıkış trafiği"
}

# =============================================================================
# VPC - Default VPC'yi kullan
# =============================================================================

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# =============================================================================
# EC2 INSTANCE - t4g.micro (ARM64, 1GB RAM, Free Tier)
# =============================================================================

resource "aws_instance" "main" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t4g.micro"
  key_name               = var.ssh_key_name
  vpc_security_group_ids = [aws_security_group.main.id]
  subnet_id              = data.aws_subnets.default.ids[0]

  # 20GB gp3 SSD (minimum)
  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
    tags = {
      Name    = "${var.project_name}-root"
      Project = var.project_name
    }
  }

  # Swap + Docker + Uygulama kurulumu
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    project_name = var.project_name
    domain_name  = var.domain_name
  }))

  tags = {
    Name    = "${var.project_name}-server"
    Project = var.project_name
    Role    = "erp-server"
  }
}

# Ubuntu 24.04 LTS ARM64 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*"]
  }

  filter {
    name   = "architecture"
    values = ["arm64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# =============================================================================
# ELASTIC IP (Statik IP)
# =============================================================================

resource "aws_eip" "main" {
  domain   = "vpc"
  instance = aws_instance.main.id

  tags = {
    Name    = "${var.project_name}-eip"
    Project = var.project_name
  }
}

# =============================================================================
# ROUTE53 DNS KAYDI
# =============================================================================

data "aws_route53_zone" "main" {
  count        = var.domain_name != "" ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

# A kaydı: goldenguard.uk -> Elastic IP
resource "aws_route53_record" "main" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"
  ttl     = 300
  records = [aws_eip.main.public_ip]
}

# A kaydı: api.goldenguard.uk -> Elastic IP
resource "aws_route53_record" "api" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.main.public_ip]
}

# =============================================================================
# OUTPUTS
# =============================================================================

output "public_ip" {
  description = "Sunucu public IP adresi"
  value       = aws_eip.main.public_ip
}

output "public_dns" {
  description = "Sunucu public DNS"
  value       = aws_instance.main.public_dns
}

output "domain" {
  description = "Domain"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${aws_eip.main.public_ip}:3000"
}

output "api_url" {
  description = "API URL"
  value       = "http://${aws_eip.main.public_ip}:8000"
}

output "swagger_url" {
  description = "Swagger API Dokümantasyonu"
  value       = "http://${aws_eip.main.public_ip}:8000/docs"
}

output "ssh_command" {
  description = "SSH bağlantı komutu"
  value       = "ssh -i ~/.ssh/${var.ssh_key_name}.pem ubuntu@${aws_eip.main.public_ip}"
}

output "approximate_monthly_cost" {
  description = "Tahmini aylık maliyet (USD)"
  value       = "~$5-8 (t4g.micro + EIP + 20GB gp3)"
}