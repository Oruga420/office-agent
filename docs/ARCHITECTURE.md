# Luna — Architecture Document

## System Overview

```
                          Slack Workspace
                               |
                          (HTTPS POST)
                               |
                               v
                    +---------------------+
                    |   GCP e2-micro VM   |
                    |   (static IP)       |
                    |                     |
                    |  +--------------+   |
                    |  | Express +    |   |
                    |  | Bolt.js     |   |
                    |  +------+-------+  |
                    |         |          |
                    |    +----v----+     |
                    |    | Router  |     |
                    |    | (rules) |     |
                    |    +--+---+--+     |
                    |       |   |        |
                    |   +---+   +---+    |
                    |   v           v    |
                    | Nemotron   Claude   |
                    | (NVIDIA)  (Anthro)  |
                    +---------------------+
                       |           |
                       v           v
                  NVIDIA API   Anthropic API
```

## Component Breakdown

### 1. Slack Layer (`src/lib/bolt/`)

Handles all Slack communication using the Bolt.js framework with Express as the HTTP receiver.

| File | Responsibility |
|------|---------------|
| `app.ts` | Creates and starts the Bolt app with ExpressReceiver |
| `system-prompt.ts` | Luna's personality and formatting instructions |
| `thread-utils.ts` | Fetches thread history, builds conversation context |
| `types.ts` | ThreadContext and ThreadMessage interfaces |
| `listeners/` | Event and command handlers (see below) |

**Listeners:**

| Listener | Trigger | Model | Response Type |
|----------|---------|-------|---------------|
| `commands/ask.ts` | `/ask` | Nemotron (forced) | Ephemeral |
| `commands/deep.ts` | `/deep` | Claude (forced) | In-channel |
| `events/app-mention.ts` | `@Luna` | Auto-routed | Thread reply |
| `messages/dm.ts` | Direct message | Auto-routed | Thread reply |

### 2. Router Layer (`src/lib/router/`)

Rule-based classification that decides which model handles each request.

| File | Responsibility |
|------|---------------|
| `classify.ts` | Priority cascade: force override > Claude triggers > Nemotron triggers > length > thread depth > default |
| `rules.ts` | Regex trigger patterns and numeric thresholds |
| `types.ts` | ModelChoice, RouteDecision, RouterInput types |

### 3. Model Layer (`src/lib/models/`)

Unified interface for calling different LLM backends.

| File | Responsibility |
|------|---------------|
| `types.ts` | LLMClient interface, ChatMessage, LLMResponse |
| `nemotron.ts` | NVIDIA NIM client via OpenAI-compatible SDK |
| `claude.ts` | Anthropic Claude client via official SDK |
| `index.ts` | Factory + lazy singleton initialization, exports `chat()` |

### 4. Rate Limit Layer (`src/lib/rate-limit/`)

Per-user request throttling with configurable windows.

| File | Responsibility |
|------|---------------|
| `index.ts` | Checks per-minute and per-hour limits, returns allow/deny |
| `memory-store.ts` | In-memory sliding window store using `Map<string, UserWindow>` |

### 5. Config Layer (`src/lib/config/`)

| File | Responsibility |
|------|---------------|
| `env.ts` | Zod schema validation for all environment variables, cached after first parse |

## Data Flow

```
1. Slack sends HTTP POST to Express endpoint
2. Bolt.js verifies Slack signature (SLACK_SIGNING_SECRET)
3. Matched listener fires (command, mention, or DM)
4. Rate limit check (per-user sliding window)
5. Input validation (empty check, length cap, mention stripping)
6. Thread context retrieval (if in a thread, up to 10 messages)
7. Router classifies message → selects model
8. Model client sends request to external API
9. Response formatted with model tag and latency
10. Reply sent back to Slack (ephemeral, in-channel, or thread)
```

## Infrastructure

| Component | Detail |
|-----------|--------|
| **VM** | GCP e2-micro (free tier), Ubuntu 22.04 LTS |
| **IP** | Static external IP for Slack webhooks |
| **Disk** | 30 GB pd-standard |
| **Process** | PM2 (auto-restart, systemd integration) |
| **IaC** | Terraform (main.tf, variables.tf, firewall.tf, outputs.tf) |
| **Firewall** | TCP 3000 (bot), TCP 22 (SSH), all egress |
| **User** | Dedicated `luna` system user (non-root) |

## Security

| Measure | Implementation |
|---------|---------------|
| Request verification | Slack signing secret validation (built into Bolt) |
| Secret storage | Environment variables only (.env.local), never in code |
| Input limits | 4,000 character cap on all inputs |
| Rate limiting | Per-user sliding window (20/min, 200/hr) |
| Minimal privileges | Dedicated service account with logging + compute roles only |
| Non-root execution | Bot runs as `luna` user, not root |
| Future | NemoClaw security policies for tool execution |

## Design Decisions

### Rule-Based Routing vs. ML Classification

**Chosen: Rule-based (regex triggers + heuristics)**

- Zero additional cost (no classifier model calls)
- Deterministic and debuggable — easy to understand why a model was chosen
- Fast (microseconds vs. milliseconds for an ML call)
- Trade-off: Less accurate on edge cases, requires manual trigger maintenance

### Express Server vs. Serverless (Vercel)

**Chosen: Express on a VM**

- Enables future CLI tool execution (`gws`, `gh`, `aws`) which requires a persistent server
- No cold start latency
- Full control over the runtime environment
- Trade-off: Requires VM management, not auto-scaling

### In-Memory Rate Limiting vs. Redis

**Chosen: In-memory (Map)**

- Zero infrastructure dependencies for MVP
- Sufficient for single-instance deployment
- Trade-off: Limits reset on restart; upgrade path to Redis is straightforward
