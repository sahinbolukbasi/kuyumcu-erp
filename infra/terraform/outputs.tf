# ==============================================================================
# 💎 Terraform Outputs
# ==============================================================================

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
  description = "Backend API URL"
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
  description = "Tahmini aylık maliyet"
  value       = "~$5-8 USD (t4g.micro + EIP + 20GB gp3)"
}