# Luna — Technical System Design

## Component Interfaces

### Router

```typescript
// Input to the classification engine
interface RouterInput {
  readonly text: string;          // Cleaned message text
  readonly forceModel?: ModelChoice; // Override from /ask or /deep
  readonly threadDepth?: number;  // Number of messages in thread
}

// Output decision
interface RouteDecision {
  readonly model: ModelChoice;    // "nemotron" | "claude"
  readonly reason: string;        // Human-readable explanation
  readonly confidence: number;    // 0.0 - 1.0
}

type ModelChoice = "nemotron" | "claude";
```

### Model Layer

```typescript
interface ChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

interface LLMResponse {
  readonly text: string;
  readonly model: string;        // Actual model ID used
  readonly tokensUsed?: number;  // Total tokens (prompt + completion)
  readonly latencyMs: number;    // Wall-clock time
}

interface LLMClient {
  chat(messages: readonly ChatMessage[]): Promise<LLMResponse>;
}
```

### Rate Limiter

```typescript
interface RateLimitResult {
  readonly allowed: boolean;
  readonly retryAfterSeconds?: number; // Present when denied
}
```

### Thread Context

```typescript
interface ThreadContext {
  readonly messages: readonly ThreadMessage[];
  readonly depth: number;        // Total messages in thread
}

interface ThreadMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}
```

## Router Classification Algorithm

The router uses a **priority cascade** — the first matching rule wins:

```
Priority 1: Force Override
  └─ If forceModel is set → use it (confidence: 1.0)

Priority 2: Claude Triggers
  └─ Regex match against CLAUDE_TRIGGERS → "claude" (confidence: 0.85)
     Patterns: code review, debugging, architecture, security,
               analyze, compare, design, multi-step, write code

Priority 3: Nemotron Triggers
  └─ Regex match against NEMOTRON_TRIGGERS → "nemotron" (confidence: 0.85)
     Patterns: summarize, translate, what/who/when/where is,
               list, define, format, convert, grammar

Priority 4: Length Heuristic
  └─ text.length > 500 chars → "claude" (confidence: 0.6)

Priority 5: Thread Depth Heuristic
  └─ threadDepth > 5 → "claude" (confidence: 0.55)

Default: "nemotron" (confidence: 0.5)
```

## Model Client Implementation

Both clients implement the `LLMClient` interface. Clients are lazily instantiated as singletons.

### Nemotron (via OpenAI-compatible SDK)

- Uses the `openai` npm package pointed at NVIDIA's NIM endpoint
- Default model: `nvidia/llama-3.3-nemotron-super-49b-v1`
- Temperature: 0.3, max_tokens: 2048
- Messages passed as-is (system, user, assistant roles)

### Claude (via Anthropic SDK)

- Uses the `@anthropic-ai/sdk` package
- Default model: `claude-sonnet-4-20250514`
- max_tokens: 4096
- System message extracted and passed via the `system` parameter
- Conversation messages filtered to user/assistant roles only

## Rate Limiting Algorithm

**Sliding window** per user with two tiers:

```
On each request:
  1. Count requests from this user in the last 60 seconds
  2. If count >= RATE_LIMIT_MAX_PER_MINUTE (default 20) → deny, retry in 60s
  3. Count requests from this user in the last 3600 seconds
  4. If count >= RATE_LIMIT_MAX_PER_HOUR (default 200) → deny, retry in 3600s
  5. Record timestamp, prune entries older than 1 hour
  6. Allow request
```

**Storage:** `Map<string, UserWindow>` where each `UserWindow` contains an immutable array of `TimestampEntry` objects. Entries older than 1 hour are pruned on each write to prevent memory growth.

## Thread Context Retrieval

When Luna is mentioned inside a thread:

1. Call `conversations.replies` with the thread's parent timestamp
2. Limit to 10 most recent messages
3. Skip the root message (thread starter)
4. Map each message to user/assistant role based on `bot_id` presence
5. Strip `<@U12345>` mentions from all text
6. Return `ThreadContext` with messages array and thread depth

The messages are prepended to the prompt so the model has conversational context.

## Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| **Env validation** | Fail fast at startup with detailed Zod error messages |
| **Listener handlers** | Try/catch around model call; respond with generic "Something went wrong" |
| **Rate limiting** | Returns structured result (no exceptions) |
| **Model clients** | Exceptions propagate to listeners; no retry logic (intentional for MVP) |
| **Server startup** | Catches start() failure, logs, exits with code 1 |

## Environment Variable Schema

| Variable | Type | Default | Validation |
|----------|------|---------|------------|
| `SLACK_SIGNING_SECRET` | string | (required) | min length 1 |
| `SLACK_BOT_TOKEN` | string | (required) | must start with `xoxb-` |
| `SLACK_APP_TOKEN` | string | (required) | must start with `xapp-` |
| `NVIDIA_API_KEY` | string | (required) | min length 1 |
| `NVIDIA_MODEL` | string | `nvidia/llama-3.3-nemotron-super-49b-v1` | — |
| `NVIDIA_BASE_URL` | string | `https://integrate.api.nvidia.com/v1` | valid URL |
| `ANTHROPIC_API_KEY` | string | (required) | min length 1 |
| `CLAUDE_MODEL` | string | `claude-sonnet-4-20250514` | — |
| `PORT` | number | `3000` | coerced to number |
| `RATE_LIMIT_MAX_PER_MINUTE` | number | `20` | positive integer |
| `RATE_LIMIT_MAX_PER_HOUR` | number | `200` | positive integer |

## Future: Tool Calling Architecture

When Google Workspace CLI and other tools are integrated, the model layer will need:

1. A tool registry mapping tool names to CLI commands
2. NemoClaw security policy enforcement before execution
3. Output parsing and formatting for Slack
4. A feedback loop allowing the model to call tools iteratively

This will likely require the Claude client to use Anthropic's tool_use API and a new execution layer between the model and Slack response.
