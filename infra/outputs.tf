# =============================================================================
# Outputs — Luna Slack Bot Infrastructure
# =============================================================================

output "vm_external_ip" {
  description = "Static external IP of the Luna bot VM (use this for Slack webhook URL)"
  value       = google_compute_address.luna_ip.address
}

output "vm_name" {
  description = "Name of the Compute Engine instance"
  value       = google_compute_instance.luna_vm.name
}

output "ssh_command" {
  description = "SSH command to connect to the Luna bot VM"
  value       = "gcloud compute ssh ${google_compute_instance.luna_vm.name} --zone=${var.zone} --project=${var.project_id}"
}
