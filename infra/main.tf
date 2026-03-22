# =============================================================================
# Luna Slack Bot — GCP Infrastructure
# =============================================================================
# Provisions an e2-micro VM (free tier) to host the Luna Slack bot.
# All resources are prefixed with "luna-" for easy identification.
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# -----------------------------------------------------------------------------
# Provider
# -----------------------------------------------------------------------------
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# -----------------------------------------------------------------------------
# Static External IP — required for Slack webhook callbacks
# -----------------------------------------------------------------------------
resource "google_compute_address" "luna_ip" {
  name         = "luna-static-ip"
  region       = var.region
  address_type = "EXTERNAL"
  description  = "Static IP for Luna Slack bot (Slack webhooks need a stable endpoint)"
}

# -----------------------------------------------------------------------------
# Service Account — minimal permissions for the VM
# -----------------------------------------------------------------------------
resource "google_service_account" "luna_sa" {
  account_id   = "luna-bot-sa"
  display_name = "Luna Bot Service Account"
  description  = "Minimal-privilege SA for the Luna Slack bot VM"
}

# Logging write access so the VM can ship logs to Cloud Logging
resource "google_project_iam_member" "luna_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.luna_sa.email}"
}

# Compute instance admin (self) — allows the VM to manage itself
resource "google_project_iam_member" "luna_compute" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin"
  member  = "serviceAccount:${google_service_account.luna_sa.email}"
}

# -----------------------------------------------------------------------------
# Compute Instance — e2-micro (free tier eligible)
# -----------------------------------------------------------------------------
resource "google_compute_instance" "luna_vm" {
  name         = "luna-bot-vm"
  machine_type = var.machine_type
  zone         = var.zone
  description  = "Luna Slack bot host (e2-micro free tier)"

  tags = ["luna-bot", "allow-ssh", "allow-bot-port"]

  labels = {
    environment = "production"
    app         = "luna"
  }

  # 30 GB standard persistent disk — within free tier limits
  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 30
      type  = "pd-standard"
    }
  }

  # Network interface with the static external IP
  network_interface {
    network = "default"

    access_config {
      nat_ip = google_compute_address.luna_ip.address
    }
  }

  # Startup script runs once on VM creation
  metadata = {
    startup-script = file("${path.module}/startup.sh")
  }

  # Minimal-privilege service account
  service_account {
    email  = google_service_account.luna_sa.email
    scopes = ["cloud-platform"]
  }

  # Ensure the VM can be stopped for maintenance without data loss
  scheduling {
    automatic_restart   = true
    on_host_maintenance = "MIGRATE"
    preemptible         = false
  }

  # Prevent Terraform from recreating the VM when the startup script changes
  lifecycle {
    ignore_changes = [metadata["startup-script"]]
  }
}
