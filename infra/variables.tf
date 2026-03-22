# =============================================================================
# Variables — Luna Slack Bot Infrastructure
# =============================================================================

variable "project_id" {
  description = "GCP project ID where resources will be created"
  type        = string
  # No default — must be provided per environment
}

variable "region" {
  description = "GCP region for regional resources (static IP, etc.)"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "GCP zone for the VM instance"
  type        = string
  default     = "us-central1-a"
}

variable "machine_type" {
  description = "GCE machine type (e2-micro is free tier eligible)"
  type        = string
  default     = "e2-micro"
}

variable "bot_port" {
  description = "Port the Luna bot listens on (used in firewall rules)"
  type        = number
  default     = 3000
}
