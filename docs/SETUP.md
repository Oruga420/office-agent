# Luna — Setup & Deployment Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | v24+ | Runtime |
| npm | v11+ | Package manager |
| Terraform | >= 1.5.0 | Infrastructure provisioning |
| gcloud CLI | latest | GCP access and SSH |
| A GCP project | — | Hosting the VM |
| A Slack workspace | — | Where Luna lives |
| NVIDIA API key | — | [build.nvidia.com](https://build.nvidia.com) |
| Anthropic API key | — | [console.anthropic.com](https://console.anthropic.com) |

## Step 1: Clone the Repository

```bash
git clone https://github.com/Oruga420/office-agent.git
cd office-agent
npm install
```

## Step 2: Create the Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** > **From a manifest**
3. Select your workspace
4. Paste the contents of `manifest.json`
5. Click **Create**
6. Go to **OAuth & Permissions** > **Install to Workspace**
7. Copy these values:
   - **Signing Secret** (from Basic Information)
   - **Bot User OAuth Token** (`xoxb-...` from OAuth & Permissions)
   - **App-Level Token** (`xapp-...` — create one under Basic Information > App-Level Tokens with `connections:write` scope)

## Step 3: Get API Keys

### NVIDIA NIM (Nemotron)

1. Go to [build.nvidia.com](https://build.nvidia.com)
2. Create an account or sign in
3. Navigate to the Nemotron model page
4. Generate an API key (`nvapi-...`)

### Anthropic (Claude)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key (`sk-ant-...`)
3. Ensure your account has credits or a billing plan

## Step 4: Deploy Infrastructure with Terraform

```bash
cd infra

# Initialize Terraform
terraform init

# Preview what will be created
terraform plan -var="project_id=YOUR_GCP_PROJECT_ID"

# Apply (creates VM, static IP, firewall rules, service account)
terraform apply -var="project_id=YOUR_GCP_PROJECT_ID"
```

Terraform outputs:
- `vm_external_ip` — The static IP for Slack webhooks
- `ssh_command` — Ready-to-use SSH command

## Step 5: Configure the VM

```bash
# SSH into the VM
gcloud compute ssh luna-bot-vm --zone=us-central1-a --project=YOUR_PROJECT_ID

# Switch to the luna user
sudo su - luna
cd /home/luna/app

# Edit the environment file
nano .env.local
```

Fill in all required values in `.env.local`:

```env
SLACK_SIGNING_SECRET=your_signing_secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
NVIDIA_API_KEY=nvapi-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

Restart the bot:

```bash
pm2 restart luna
pm2 logs luna    # Verify it starts cleanly
```

## Step 6: Update Slack App URLs

1. Go to your app at [api.slack.com/apps](https://api.slack.com/apps)
2. Replace all instances of `YOUR_VERCEL_URL` with your VM's static IP:

   **Event Subscriptions > Request URL:**
   ```
   http://STATIC_IP:3000/slack/events
   ```

   **Slash Commands > /ask and /deep:**
   ```
   http://STATIC_IP:3000/slack/events
   ```

3. Slack will send a verification challenge — the server must be running

## Step 7: Test in Slack

1. Invite Luna to a channel: `/invite @Luna`
2. Try a mention: `@Luna what is TypeScript?`
3. Try a quick ask: `/ask define REST API`
4. Try a deep query: `/deep review this architecture for scalability issues`
5. Send Luna a direct message

## Local Development

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env.local

# Fill in your API keys in .env.local

# Start dev server with hot reload
npm run dev

# For Slack to reach your local machine, use a tunnel:
# ngrok http 3000
# Then update Slack app URLs to your ngrok URL
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start with hot reload (tsx watch) |
| `build` | `npm run build` | Compile TypeScript to dist/ |
| `start` | `npm run start` | Run compiled JS (production) |
| `lint` | `npm run lint` | Run Biome linter |
| `format` | `npm run format` | Auto-format with Biome |
| `typecheck` | `npm run typecheck` | Type-check without emitting |
| `test` | `npm run test` | Run tests with Vitest |
| `test:coverage` | `npm run test:coverage` | Tests with coverage report |

## Troubleshooting

### "Environment validation failed" on startup

One or more required environment variables are missing or malformed. Check:
- `.env.local` exists and is in the project root
- `SLACK_BOT_TOKEN` starts with `xoxb-`
- `SLACK_APP_TOKEN` starts with `xapp-`
- All required fields are non-empty

### Slack shows "dispatch_failed"

- The server is not reachable at the configured URL
- Check firewall rules allow TCP 3000
- Verify the static IP matches what's in Slack settings
- Check PM2: `pm2 status`, `pm2 logs luna`

### "Rate limit exceeded" for every request

- Check `RATE_LIMIT_MAX_PER_MINUTE` and `RATE_LIMIT_MAX_PER_HOUR` values
- Rate limits reset on server restart (in-memory store)

### Luna doesn't respond in channels

- Ensure Luna is invited to the channel
- Check that `app_mentions:read` and `chat:write` scopes are granted
- Verify Event Subscriptions URL is correct and verified
