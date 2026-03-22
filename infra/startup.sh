#!/bin/bash
set -euo pipefail

# =============================================================================
# Luna Slack Bot — VM Startup Script
# =============================================================================
# Runs once on VM creation. Installs dependencies, clones the repo, and starts
# the bot under PM2 as the "luna" user.
# =============================================================================

export DEBIAN_FRONTEND=noninteractive

# -----------------------------------------------------------------------------
# System updates
# -----------------------------------------------------------------------------
apt-get update && apt-get upgrade -y

# -----------------------------------------------------------------------------
# Install Node.js 24
# -----------------------------------------------------------------------------
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs git

# -----------------------------------------------------------------------------
# Create dedicated app user (non-root)
# -----------------------------------------------------------------------------
useradd -m -s /bin/bash luna
mkdir -p /home/luna/app

# -----------------------------------------------------------------------------
# Install gws CLI (placeholder — user will configure auth after VM creation)
# -----------------------------------------------------------------------------
# curl -fsSL https://... | bash

# -----------------------------------------------------------------------------
# Install NemoClaw (placeholder — user will configure after VM creation)
# -----------------------------------------------------------------------------
# curl -fsSL https://nvidia.com/nemoclaw.sh | bash

# -----------------------------------------------------------------------------
# Install PM2 globally for process management
# -----------------------------------------------------------------------------
npm install -g pm2

# -----------------------------------------------------------------------------
# Clone repo and install dependencies
# -----------------------------------------------------------------------------
cd /home/luna/app
git clone https://github.com/Oruga420/office-agent.git .
npm install
npm run build

# -----------------------------------------------------------------------------
# Create .env template (user fills in secrets after VM creation)
# -----------------------------------------------------------------------------
cat > .env.local << 'ENVEOF'
# Fill these in after VM creation
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=
NVIDIA_API_KEY=
NVIDIA_MODEL=nvidia/nemotron-3-super-120b-a12b
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-20250514
RATE_LIMIT_MAX_PER_MINUTE=20
RATE_LIMIT_MAX_PER_HOUR=200
PORT=3000
ENVEOF

# -----------------------------------------------------------------------------
# Fix ownership and start the bot
# -----------------------------------------------------------------------------
chown -R luna:luna /home/luna/app

su - luna -c "cd /home/luna/app && pm2 start npm --name luna -- start && pm2 save && pm2 startup systemd -u luna --hp /home/luna"
