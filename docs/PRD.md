# Luna (office-agent) — Product Requirements Document

## Product Overview

Luna is an AI-powered Slack bot that provides office productivity assistance through hybrid LLM routing. It intelligently routes user queries between two AI backends — NVIDIA Nemotron (fast, cost-effective) and Anthropic Claude (deep reasoning) — to balance speed, quality, and cost.

## Problem Statement

Office workers need AI assistance accessible from where they already work. Switching to a separate AI tool breaks flow and adds friction. Luna brings AI directly into Slack, where teams already communicate, making it zero-effort to get answers, draft content, debug code, or analyze problems.

## Target Users

- Small-to-medium teams (5-50 people) using Slack for daily communication
- Knowledge workers: engineers, PMs, designers, operations
- Teams that want AI assistance without managing separate AI subscriptions per user

## Core Features

### 1. @Luna Mentions (Auto-Routed)

Mention Luna in any channel or thread. The router automatically selects the best model:

- **Nemotron** for simple queries: definitions, translations, summaries, formatting
- **Claude** for complex queries: code review, architecture, debugging, multi-step analysis
- Routing uses a priority cascade: trigger patterns, message length, thread depth

### 2. `/ask` Command (Quick Answers)

- Forces **Nemotron** (fast, low-cost)
- **Ephemeral** response (only visible to the user)
- Best for quick lookups that don't need to be shared

### 3. `/deep` Command (Deep Analysis)

- Forces **Claude** (high capability)
- **In-channel** response (visible to everyone)
- Best for complex questions the team should see

### 4. Direct Messages

- Send Luna a DM for private conversations
- Auto-routed like @mentions
- No thread context (single-turn)

### 5. Thread Context Awareness

- When mentioned in a thread, Luna reads up to 10 previous messages
- Builds multi-turn conversation history (user/assistant roles)
- Thread depth influences routing (deep threads escalate to Claude)

### 6. Per-User Rate Limiting

- Configurable limits: default 20/minute, 200/hour
- In-memory sliding window per user
- Returns retry-after time when exceeded

### 7. Input Validation

- Empty input detection with usage hints
- 4,000-character message length cap
- Slack mention stripping before processing

## Future Features

| Feature | Description |
|---------|-------------|
| Google Workspace CLI | Drive, Gmail, Calendar, Sheets integration via `gws` CLI tool |
| NemoClaw Security | NVIDIA NemoClaw security policies for safe tool execution |
| CLI Tool Access | `gh`, `aws`, `gcloud` commands accessible through Luna |
| Redis Rate Limiting | Persistent rate limits that survive restarts |
| Streaming Responses | Real-time streaming for long responses |
| Multi-workspace | Support multiple Slack workspaces |

## Success Metrics

| Metric | Target |
|--------|--------|
| Response latency (Nemotron) | < 2 seconds |
| Response latency (Claude) | < 10 seconds |
| Routing accuracy | > 80% correct model selection |
| Cost per query (avg) | < $0.01 (blended) |
| Uptime | 99.5% |
| User adoption | > 50% of team uses Luna weekly |

## Non-Goals

- Not a replacement for dedicated tools (IDE, project management, etc.)
- Not designed for sensitive/classified data processing
- Not a general-purpose chatbot — focused on office productivity
- Not a multi-tenant SaaS — single workspace deployment
