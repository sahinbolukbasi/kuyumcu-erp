# ==============================================================================
# 💎 Terraform Variables
# ==============================================================================

variable "aws_region" {
  description = "AWS bölgesi"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Proje adı"
  type        = string
  default     = "kuyumculuk"
}

variable "domain_name" {
  description = "Domain adı (Route53 zone varsa)"
  type        = string
  default     = "goldenguard.uk"
}

variable "ssh_key_name" {
  description = "AWS EC2 Key Pair adı"
  type        = string
  default     = "kuyumcu-key"
}

variable "instance_type" {
  description = "EC2 instance tipi"
  type        = string
  default     = "t4g.micro"
}

variable "volume_size" {
  description = "Root disk boyutu (GB)"
  type        = number
  default     = 20
}