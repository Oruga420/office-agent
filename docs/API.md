# Luna — Internal API Reference

## Module: `src/lib/bolt/app.ts`

### `start(): Promise<void>`

Initializes and starts the Bolt.js application. Creates the ExpressReceiver, registers all listeners, and begins listening on the configured port.

```typescript
import { start } from "./lib/bolt/app";
await start(); // Luna is running on port 3000
```

### `getApp(): App`

Returns the singleton Bolt `App` instance, creating it on first call.

```typescript
import { getApp } from "./lib/bolt/app";
const app = getApp();
```

---

## Module: `src/lib/router/classify.ts`

### `classifyMessage(input: RouterInput): RouteDecision`

Classifies a user message and returns which model should handle it.

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `text` | `string` | Yes | The cleaned user message |
| `forceModel` | `"nemotron" \| "claude"` | No | Force a specific model (from /ask or /deep) |
| `threadDepth` | `number` | No | Number of messages in the thread |

**Returns:** `RouteDecision`

| Field | Type | Description |
|-------|------|-------------|
| `model` | `"nemotron" \| "claude"` | Selected model |
| `reason` | `string` | Human-readable explanation |
| `confidence` | `number` | Confidence score (0.0 - 1.0) |

**Example:**

```typescript
import { classifyMessage } from "./lib/router/classify";

const decision = classifyMessage({ text: "debug this function" });
// { model: "claude", reason: "Message matches Claude trigger...", confidence: 0.85 }

const simple = classifyMessage({ text: "what is a REST API?" });
// { model: "nemotron", reason: "Message matches Nemotron trigger...", confidence: 0.85 }
```

---

## Module: `src/lib/models/index.ts`

### `chat(model: ModelChoice, messages: readonly ChatMessage[]): Promise<LLMResponse>`

Sends a conversation to the specified model and returns the response.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | `"nemotron" \| "claude"` | Which backend to use |
| `messages` | `readonly ChatMessage[]` | Conversation history (system + user + assistant) |

**Returns:** `LLMResponse`

| Field | Type | Description |
|-------|------|-------------|
| `text` | `string` | The model's response text |
| `model` | `string` | Actual model ID used (e.g., `claude-sonnet-4-20250514`) |
| `tokensUsed` | `number \| undefined` | Total tokens consumed |
| `latencyMs` | `number` | Wall-clock response time in milliseconds |

**Example:**

```typescript
import { chat } from "./lib/models";

const response = await chat("nemotron", [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "What is TypeScript?" },
]);
// { text: "TypeScript is...", model: "nvidia/llama-3.3-...", tokensUsed: 150, latencyMs: 800 }
```

---

## Module: `src/lib/rate-limit/index.ts`

### `checkRateLimit(userId: string): RateLimitResult`

Checks whether a user is within rate limits. If allowed, records the request.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Slack user ID |

**Returns:** `RateLimitResult`

| Field | Type | Description |
|-------|------|-------------|
| `allowed` | `boolean` | Whether the request is allowed |
| `retryAfterSeconds` | `number \| undefined` | Seconds until the user can retry (present when denied) |

**Example:**

```typescript
import { checkRateLimit } from "./lib/rate-limit";

const result = checkRateLimit("U12345");
if (!result.allowed) {
  console.log(`Retry in ${result.retryAfterSeconds}s`);
}
```

---

## Module: `src/lib/rate-limit/memory-store.ts`

### `countSince(userId: string, since: number): number`

Returns the number of requests from a user since the given timestamp.

### `recordRequest(userId: string): void`

Records a request timestamp for the user. Automatically prunes entries older than 1 hour.

---

## Module: `src/lib/config/env.ts`

### `getEnv(): Env`

Parses and validates all environment variables using a Zod schema. Results are cached after the first successful parse.

**Throws:** `Error` with formatted validation messages if any required variables are missing or invalid.

**Returns:** `Env` — a typed, validated object with all config values.

```typescript
import { getEnv } from "./lib/config/env";

const env = getEnv();
console.log(env.PORT);            // 3000
console.log(env.CLAUDE_MODEL);    // "claude-sonnet-4-20250514"
```

---

## Module: `src/lib/bolt/thread-utils.ts`

### `getThreadContext(client: WebClient, channel: string, threadTs: string, botUserId: string): Promise<ThreadContext>`

Fetches up to 10 messages from a Slack thread and converts them into a conversation context.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `client` | `WebClient` | Slack Web API client |
| `channel` | `string` | Channel ID |
| `threadTs` | `string` | Thread parent timestamp |
| `botUserId` | `string` | Bot's user ID (to identify assistant messages) |

**Returns:** `ThreadContext`

| Field | Type | Description |
|-------|------|-------------|
| `messages` | `readonly ThreadMessage[]` | Conversation history with user/assistant roles |
| `depth` | `number` | Total number of messages in the thread |

---

## Module: `src/lib/bolt/listeners/`

### `registerListeners(app: App): void`

Registers all command, event, and message listeners on the Bolt app. Called once during app initialization.

### `registerAskCommand(app: App): void`

Registers the `/ask` slash command handler.

### `registerDeepCommand(app: App): void`

Registers the `/deep` slash command handler.

### `registerAppMention(app: App): void`

Registers the `app_mention` event handler.

### `registerDmListener(app: App): void`

Registers the direct message listener.

---

## Types Reference

### `ChatMessage`
```typescript
{ readonly role: "system" | "user" | "assistant"; readonly content: string }
```

### `LLMResponse`
```typescript
{ readonly text: string; readonly model: string; readonly tokensUsed?: number; readonly latencyMs: number }
```

### `LLMClient`
```typescript
{ chat(messages: readonly ChatMessage[]): Promise<LLMResponse> }
```

### `ModelChoice`
```typescript
"nemotron" | "claude"
```

### `RouteDecision`
```typescript
{ readonly model: ModelChoice; readonly reason: string; readonly confidence: number }
```

### `RouterInput`
```typescript
{ readonly text: string; readonly forceModel?: ModelChoice; readonly threadDepth?: number }
```

### `RateLimitResult`
```typescript
{ readonly allowed: boolean; readonly retryAfterSeconds?: number }
```

### `ThreadContext`
```typescript
{ readonly messages: readonly ThreadMessage[]; readonly depth: number }
```

### `ThreadMessage`
```typescript
{ readonly role: "user" | "assistant"; readonly content: string }
```

### `Env`
Zod-inferred type containing all validated environment variables. See `src/lib/config/env.ts` for the full schema.
