# Luna

AI-powered Slack bot with hybrid LLM routing — fast answers from Nemotron, deep analysis from Claude.

## Quick Start

```bash
git clone https://github.com/Oruga420/office-agent.git
cd office-agent
npm install
cp .env.example .env.local   # Fill in your API keys
npm run dev                   # Start with hot reload
```

## Features

- **@Luna mentions** — Auto-routes between Nemotron (simple) and Claude (complex)
- **`/ask` command** — Quick ephemeral answers via Nemotron
- **`/deep` command** — Deep in-channel analysis via Claude
- **Direct messages** — Private conversations with auto-routing
- **Thread context** — Reads up to 10 messages for multi-turn conversations
- **Smart routing** — Rule-based classification using regex triggers, message length, and thread depth
- **Rate limiting** — Per-user sliding window (20/min, 200/hr)
- **Input validation** — Length caps, empty input handling, mention stripping

## Architecture

```
Slack ──POST──> GCP VM (Express + Bolt.js)
                    │
                    ├── Router (rule-based classify)
                    │     │
                    │     ├── Nemotron (NVIDIA NIM)  ← simple queries
                    │     └── Claude (Anthropic)     ← complex queries
                    │
                    └── Rate Limiter (per-user, in-memory)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 24, TypeScript (ES2022) |
| Slack SDK | @slack/bolt 4.x, @slack/web-api 7.x |
| AI Models | NVIDIA Nemotron (via OpenAI SDK), Anthropic Claude |
| Validation | Zod |
| Linter | Biome |
| Tests | Vitest |
| Infra | GCP e2-micro VM, Terraform, PM2 |

## Project Structure

```
office-agent/
├── src/
│   ├── server.ts                    # Entry point
│   └── lib/
│       ├── bolt/                    # Slack integration
│       │   ├── app.ts              # Bolt app + Express receiver
│       │   ├── system-prompt.ts    # Luna personality
│       │   ├── thread-utils.ts     # Thread context retrieval
│       │   ├── types.ts            # Thread types
│       │   └── listeners/
│       │       ├── commands/       # /ask, /deep
│       │       ├── events/         # @mention handler
│       │       └── messages/       # DM handler
│       ├── config/
│       │   └── env.ts              # Zod-validated environment
│       ├── models/
│       │   ├── index.ts            # Unified chat() dispatcher
│       │   ├── nemotron.ts         # NVIDIA NIM client
│       │   ├── claude.ts           # Anthropic client
│       │   └── types.ts            # LLMClient interface
│       ├── rate-limit/
│       │   ├── index.ts            # Rate check logic
│       │   └── memory-store.ts     # In-memory sliding window
│       └── router/
│           ├── classify.ts         # Priority cascade classifier
│           ├── rules.ts            # Regex triggers + thresholds
│           └── types.ts            # Router types
├── infra/                          # Terraform (GCP)
│   ├── main.tf                     # VM, IP, service account
│   ├── variables.tf                # Configurable inputs
│   ├── outputs.tf                  # IP, SSH command
│   ├── firewall.tf                 # Ingress/egress rules
│   └── startup.sh                  # VM bootstrap script
├── manifest.json                   # Slack app manifest
├── .env.example                    # Environment template
├── tsconfig.json
└── package.json
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SLACK_SIGNING_SECRET` | Yes | — | Slack app signing secret |
| `SLACK_BOT_TOKEN` | Yes | — | Bot token (`xoxb-...`) |
| `SLACK_APP_TOKEN` | Yes | — | App token (`xapp-...`) |
| `NVIDIA_API_KEY` | Yes | — | NVIDIA NIM API key |
| `NVIDIA_MODEL` | No | `nvidia/llama-3.3-nemotron-super-49b-v1` | Nemotron model ID |
| `NVIDIA_BASE_URL` | No | `https://integrate.api.nvidia.com/v1` | NIM endpoint |
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key |
| `CLAUDE_MODEL` | No | `claude-sonnet-4-20250514` | Claude model ID |
| `PORT` | No | `3000` | Server port |
| `RATE_LIMIT_MAX_PER_MINUTE` | No | `20` | Max requests per user per minute |
| `RATE_LIMIT_MAX_PER_HOUR` | No | `200` | Max requests per user per hour |

## Development

```bash
npm run dev            # Hot-reload dev server
npm run build          # Compile TypeScript
npm run lint           # Biome lint check
npm run format         # Biome auto-format
npm run typecheck      # Type check only
npm run test           # Run tests
npm run test:coverage  # Tests with coverage
```

## Deployment

```bash
cd infra
terraform init
terraform apply -var="project_id=YOUR_GCP_PROJECT"
# SSH in, configure .env.local, restart PM2
```

See [docs/SETUP.md](docs/SETUP.md) for the full deployment guide.

## Testing

```bash
npm run test           # Unit tests with Vitest
npm run test:coverage  # With coverage report
```

Tests are in `*.test.ts` files alongside source code. Router classification and trigger rules have unit test coverage.

## License

MIT

## Documentation

- [Product Requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [System Design](docs/SYSTEM_DESIGN.md)
- [Setup & Deployment](docs/SETUP.md)
- [API Reference](docs/API.md)
