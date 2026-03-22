# =============================================================================
# Firewall Rules — Luna Slack Bot
# =============================================================================

# -----------------------------------------------------------------------------
# Inbound: Allow Slack webhooks on the bot port (TCP 3000)
# Slack sends HTTP POST requests to this port for events and interactions.
# -----------------------------------------------------------------------------
resource "google_compute_firewall" "luna_allow_bot_port" {
  name        = "luna-allow-bot-port"
  network     = "default"
  description = "Allow inbound traffic to Luna bot port from Slack webhooks"
  direction   = "INGRESS"
  priority    = 1000

  allow {
    protocol = "tcp"
    ports    = [tostring(var.bot_port)]
  }

  # Slack does not publish a fixed IP range, so we allow from anywhere
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["allow-bot-port"]
}

# -----------------------------------------------------------------------------
# Inbound: Allow SSH (TCP 22) for administration
# -----------------------------------------------------------------------------
resource "google_compute_firewall" "luna_allow_ssh" {
  name        = "luna-allow-ssh"
  network     = "default"
  description = "Allow SSH access to Luna bot VM"
  direction   = "INGRESS"
  priority    = 1000

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["allow-ssh"]
}

# -----------------------------------------------------------------------------
# Outbound: Allow all egress (API calls to Slack, NVIDIA, Anthropic, etc.)
# GCP allows all egress by default, but we define it explicitly for clarity.
# -----------------------------------------------------------------------------
resource "google_compute_firewall" "luna_allow_egress" {
  name        = "luna-allow-egress"
  network     = "default"
  description = "Allow all outbound traffic (Slack API, NVIDIA API, Anthropic API)"
  direction   = "EGRESS"
  priority    = 1000

  allow {
    protocol = "all"
  }

  destination_ranges = ["0.0.0.0/0"]
  target_tags        = ["luna-bot"]
}
