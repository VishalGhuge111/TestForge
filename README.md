# TestForge

**HTTP inspection and testing utility built for developers.**

A self-contained request builder and response debugger. Send requests, inspect responses, manage history, and debug API behavior — no database, no auth layer, no dependencies beyond React and Next.js.

---

## Overview

TestForge is built for developers who need to inspect, test, and debug HTTP APIs without the overhead of heavier platforms. It provides:

- **Server-side request execution** — Every request proxied through a Next.js backend, eliminating CORS and providing consistent error categorization.
- **Request persistence** — Up to 30 recent requests stored in localStorage for quick iteration and replay.
- **Response inspection** — Status codes, headers, timing, payload size, and formatted JSON — all in one view.
- **Error clarity** — Automatic detection and classification of common failures: timeouts, auth rejections, rate limits, network errors.
- **Lightweight by design** — No databases, no accounts, no billing. Runs locally or on any Node.js host.

**Philosophy:** Tools for engineers, not dashboards for stakeholders. Request/response clarity, local persistence, zero setup.

---

## Features

### Request Configuration
- URL input with full method selection: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- Headers editor with quick-add interface
- JSON request body editor
- Authentication: Bearer token and Basic auth
- Per-request timeout configuration
- In-flight request cancellation

### Response Analysis
- Status code display with semantic color coding
- Response timing and payload size metrics
- Dedicated headers inspection tab
- Formatted JSON viewer with collapsible tree structure
- Syntax highlighting throughout
- Download option for large payloads (>500KB)

### Request Management
- Automatic history tracking — last 30 requests
- Named save/load for explicit request storage
- Favorites for frequent endpoints
- One-click replay
- Export as production-ready cURL commands
- Full-text search and filter across history

### Error Diagnostics
- Automatic error categorization: timeout, CORS, auth, rate limit, network, parse
- Context-aware fix suggestions per failure type
- Rate limit header detection and display

### Developer Experience
- Dark mode default with light mode toggle
- `Cmd/Ctrl+Enter` to fire requests
- Responsive across desktop and mobile
- Zero config to start — clone, install, run
- Privacy-first: all data stays in localStorage, nothing leaves the device

### Optional AI Assistance
- Error explanation and fix suggestions powered by OpenAI API
- Activates only when `OPENAI_API_KEY` is set
- All core features work fully without it

---

## Screenshots

### Main Inspector Workspace
![Inspector Workspace](./public/inspector.png)

Split-panel workspace: request builder, response viewer, assertions, collections, and environment management.

---

### GET Request Testing
![GET Request](./public/get-method.png)

REST endpoint testing with saved collections, reusable environments, assertions, and formatted JSON inspection.

---

### POST Request Workflow
![POST Request](./public/post-method.png)

POST with JSON payloads, custom headers, response validation, and structured response analysis.

---

### PUT Request & Response Validation
![PUT Request](./public/put-method.png)

Resource updates with request body editing, status assertions, response metrics, and debug insights.

---

### Saved Requests & Recent Activity
![Saved Requests](./public/saved-recent.png)

Collection-based request management with replay, history tracking, and local persistence.

---

### AI Error Diagnostics
![Error Diagnostics](./public/error-explanations.png)

Automatic error categorization with contextual debugging, suggested fixes, and AI-assisted explanations.

---

### Documentation System
![Documentation](./public/docs.png)

Built-in docs covering request workflows, testing, debugging, and platform usage.

---

## Architecture

### Request Execution Flow

```
User Input (RequestBuilder)
    ↓
Next.js Frontend validates input
    ↓
POST /api/request (config object)
    ↓
Backend: timeout wrapper + AbortController
    ↓
fetch() → external API with headers/auth
    ↓
Catch errors → classify by type
    ↓
Return { status, headers, body, timing, error }
    ↓
Frontend: parse JSON, render response
    ↓
Optional: POST to OpenAI for diagnostics (if OPENAI_API_KEY set)
```

### Key Design Patterns

#### Server-Side Proxy
All HTTP requests route through `/api/request` rather than executing directly in the browser:
- **CORS elimination** — No browser origin restrictions
- **Timeout enforcement** — AbortController-based cancellation runs server-side
- **Error consistency** — Single error handling path for all request types
- **Credential safety** — Auth headers never reach the client bundle

#### localStorage Persistence
Request history and saved collections live entirely in browser localStorage:
- 30-item cap per collection with automatic eviction of oldest entries
- Metadata only: URL, method, headers, body, timestamp
- Response bodies are not persisted (storage efficiency)
- Survives page refreshes; cleared on localStorage wipe

#### Error Categorization
Every failure is classified with a targeted fix suggestion:
```typescript
'timeout'   → Request exceeded configured time limit
'cors'      → Browser origin blocked (bypassed via proxy; shouldn't occur)
'auth'      → 401/403 response codes
'rateLimit' → 429 status or rate limit headers present
'network'   → Connection failure or DNS resolution error
'parse'     → Response body is not valid JSON
```

#### Lazy JSON Expansion
Large response bodies render as a collapsed tree by default:
- Sections expand on click — no upfront render of the full payload
- Prevents UI thread blocking on large responses
- Payloads exceeding 500KB show a truncated preview with a download link

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/request` | POST | Execute HTTP request with timeout/cancellation |
| `/api/history` | GET | Retrieve stored request history |
| `/api/history` | DELETE | Clear history or remove specific entries |
| `/api/ai/explain` | POST | AI error explanation (requires OpenAI key) |
| `/api/ai/suggest` | POST | AI fix suggestions (requires OpenAI key) |

### Core Modules

| Module | Purpose |
|--------|---------|
| `lib/types.ts` | TypeScript definitions for requests, responses, errors |
| `lib/utils.ts` | JSON parsing, formatting, shared utilities |
| `lib/error-categorizer.ts` | Error classification logic |
| `lib/curl-builder.ts` | cURL command generation from request config |
| `lib/request-history-manager.ts` | localStorage read/write management |
| `components/RequestBuilder.tsx` | Request configuration UI |
| `components/ResponseViewer.tsx` | Response rendering and state management |
| `components/JSONViewer.tsx` | Collapsible JSON tree component |
| `components/HistoryPanel.tsx` | Request history list and search |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.7 |
| **React** | React 19 |
| **Styling** | Tailwind CSS 4.2 |
| **Components** | shadcn/ui (Radix UI) |
| **Icons** | Lucide Icons |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts 2.15 |
| **Storage** | Browser localStorage |
| **HTTP** | Native fetch API |
| **Deployment** | Vercel Analytics ready |

---

## Request Flow Examples

### GET Request

```http
GET https://api.github.com/users/octocat
Authorization: Bearer <github-token>
Accept: application/json
```

**Response:**
```json
{
  "status": 200,
  "headers": {
    "content-type": "application/json; charset=utf-8",
    "x-ratelimit-remaining": "59",
    "x-ratelimit-reset": "1234567890"
  },
  "body": {
    "login": "octocat",
    "id": 1,
    "name": "The Octocat",
    "public_repos": 2
  },
  "timing": 145,
  "size": 1024
}
```

### POST Request with Body

```http
POST https://jsonplaceholder.typicode.com/posts
Content-Type: application/json

{
  "title": "New Post",
  "body": "This is a test post",
  "userId": 1
}
```

**Response:**
```json
{
  "status": 201,
  "headers": {
    "content-type": "application/json"
  },
  "body": {
    "id": 101,
    "title": "New Post",
    "body": "This is a test post",
    "userId": 1
  },
  "timing": 234,
  "size": 256
}
```

### Error Response (Rate Limited)

```http
GET https://api.twitter.com/2/tweets/12345
Authorization: Bearer <token>
```

**Error Detection:**
```json
{
  "status": 429,
  "error": {
    "category": "rateLimit",
    "message": "Too Many Requests",
    "suggestion": "Rate limit exceeded. Check X-RateLimit-Reset header for retry time.",
    "headers": {
      "x-ratelimit-remaining": "0",
      "x-ratelimit-reset": "1234567890"
    }
  }
}
```

---

## Environment Variables

TestForge runs without any configuration. AI diagnostics are opt-in:

```bash
# Optional: Enable AI-assisted error explanations and fix suggestions
OPENAI_API_KEY=sk_...

# Optional: Override default model (defaults to gpt-4o-mini)
OPENAI_MODEL=gpt-4-turbo
```

**Notes:**
- `OPENAI_API_KEY` is entirely optional
- Request building, history, and error categorization all work without it
- Local error detection runs fully offline
- AI features activate only when the key is present

---

## Local Development

### Prerequisites
- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/VishalGhuge111/TestForge.git
cd testforge

# Install dependencies
pnpm install

# Or with npm
npm install
```

### Development Server

```bash
pnpm dev
# or: npm run dev

# Open http://localhost:3000
```

HMR enabled. Changes to `app/` or `components/` reflect immediately in the browser.

### Production Build

```bash
pnpm build
pnpm start
```

### Linting

```bash
npm run lint
```

---

## Folder Structure

```
testforge/
├── app/
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Main inspector page
│   ├── globals.css
│   ├── api/
│   │   ├── request/route.ts         # POST /api/request
│   │   ├── history/route.ts         # GET/DELETE /api/history
│   │   └── ai/
│   │       ├── explain/route.ts
│   │       └── suggest/route.ts
│   └── docs/page.tsx
│
├── components/
│   ├── RequestBuilder.tsx           # Request configuration form
│   ├── ResponseViewer.tsx           # Response display and state
│   ├── JSONViewer.tsx               # Collapsible JSON tree
│   ├── HistoryPanel.tsx             # History list and search
│   └── ai-insights/
│       ├── AIInsights.tsx
│       ├── ExplainErrorButton.tsx
│       └── AISettings.tsx
│
├── lib/
│   ├── types.ts
│   ├── utils.ts
│   ├── error-categorizer.ts
│   ├── curl-builder.ts
│   ├── request-history-manager.ts
│   └── validation.ts
│
├── public/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Engineering Decisions

### 1. Server-Side Request Proxy
**Decision:** All external requests execute through `/api/request` on the backend, not via direct browser fetch.

**Why:**
- Eliminates CORS errors unconditionally
- Timeout and cancellation enforced server-side via AbortController
- Mirrors real production request architecture

**Tradeoff:** One additional network hop — negligible at debugging timescales.

### 2. No Backend Database
**Decision:** localStorage only. No server-side persistence layer.

**Why:**
- Zero infrastructure required to deploy or self-host
- Works fully offline
- Data never leaves the device — privacy by default

**Constraint:** Single-device scope; 30-request cap per collection.

### 3. Optional AI Diagnostics
**Decision:** AI features gate behind `OPENAI_API_KEY`. Core tool is fully functional without it.

**Why:**
- No external dependency required to use the tool
- No vendor lock-in for teams that can't use OpenAI
- AI is an enhancement layer, not a core dependency

**Tradeoff:** Advanced diagnostics require an external API call and key.

### 4. No Authentication System
**Decision:** No user accounts. Local storage only.

**Why:**
- No signup friction
- Smaller, auditable codebase
- Privacy-first by architecture

**Constraint:** No cross-device sync or team workspaces.

### 5. Lazy JSON Expansion
**Decision:** JSON trees render collapsed; sections expand on user interaction.

**Why:**
- Handles arbitrarily large response payloads without blocking the UI thread
- Keeps initial render fast regardless of payload size
- Developer controls exactly what gets inspected

**Tradeoff:** Minor delay on first tree expansion.

---

## Planned Improvements

- **Import/Export Collections** — Serialize and share request collections as JSON
- **HAR Format Support** — Import/export `.har` files for tooling interoperability
- **Team Workspaces** — Optional cloud sync for shared collections
- **Advanced Assertions** — Composable, chainable assertion chains
- **Request Tabs** — Run and compare multiple requests concurrently
- **GraphQL Support** — Query builder with schema introspection
- **Webhook Debugging** — Local listener endpoint for incoming webhook inspection
- **Performance Profiling** — Per-phase request timing breakdown (DNS, TLS, TTFB, transfer)

---

## License

MIT. See [LICENSE](LICENSE) for full text.

---

## Contributing

Bug reports and feedback welcome. Open an issue to discuss problems or proposed changes.