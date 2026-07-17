# Autodisco - Lineage Braid Spec

The Lineage Braid provides a visual, inspectable genetic lineage panel tracing events backward through the shared Supabase ledger.

## Server-Side Traversal Contract

### Endpoint
`GET /api/hive/lineage/:eventId?maxDepth=5`

* **Parameters:**
  * `eventId`: Required. Must be a valid UUID corresponding to a ledger record.
  * `maxDepth`: Optional. Clamped to `1-10` (default is `5`).
* **Logic:**
  1. Starts at the specified `eventId`.
  2. Extracts the parent event ID from `metadata.parent_event_id`, `content.parent_event_id`, or `metadata.supersedes_event_id`.
  3. Halts traversal when hitting:
     * A root witness (no parent ID).
     * Missing parent receipt in the ledger (`status: "missing"`).
     * Infinite cycle loop (`status: "loop_detected"`).
     * Depth cap boundary (`status: "depth_limit"`).
* **Return Format:**
```json
{
  "startEventId": "uuid-string",
  "chain": [
    {
      "id": "uuid-string",
      "status": "resolved" | "missing" | "loop_detected" | "depth_limit",
      "ledgerUri": "ledger://events/<id>",
      "type": "AUTODISCO_MUTATION_ACCEPTED" | "SUMMARY_WRITTEN" | "MESSAGE_POSTED" | "UNKNOWN_EVENT" | null,
      "createdAt": "ISO-8601-timestamp" | null,
      "mode": "METAPHOR" | "COMPOST" | "OBSERVED" | "DERIVED" | "INTERPRETATION" | null,
      "hop": number | null,
      "originNode": "string" | null,
      "nodeName": "string" | null,
      "traceId": "string" | null,
      "parentEventId": "string" | null,
      "summary": "truncated-string"
    }
  ]
}
```

## Client-Side Presentation (`LineageBraid.tsx`)

* Fully native React/TypeScript component utilizing standard Tailwind utility classes.
* Matches the **Digital Porch / Autodisco** tactile tactile aesthetic (`#1C1A17` background, with custom colored genetic paths: resolved ancestry `#64abbe`, active mutations `#be6447`, loop/limit/missing boundaries `#555555`).
* Offers on-card receipt details, copies Ledger URIs, and provides complete accessibility.

## Owner Authentication & Secure Hearth Gate

Autodisco includes a secure, single-owner passwordless Auth Gate ("Enter the Hearth") designed for the local preview and production environment.

### 1. Environment Configurations
Add these placeholders/secrets to your environment:
```env
# Shared Supabase Configuration
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_AUTODISCO_SPACE_ID=

SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
AUTODISCO_SPACE_ID=
AUTODISCO_OWNER_EMAIL=owner@static-collective.org
```

### 2. Protected Server Endpoints
All API routes accessing Supabase, private Codex materials, or music generators are guarded by the `requireOwner` middleware:
- `/api/chat`, `/api/pour`, `/api/birth-ceremony`, `/api/ritual/succession`
- `/api/codex` (both `GET` & `POST`)
- `/api/suno/*` (configuration, tests, generations, oracles)
- `/api/music-theory` and `/api/music-sessions`
- `/api/generate-theory`
- `/api/quantum-yarn/*`
- All Hive network and telemetry operations (`/api/v1/hive/*`, `/api/hive/accept`, `/api/hive/lineage/:eventId`)

### 3. Verification & Authentication Flow
- **Magic Link:** Enter your `AUTODISCO_OWNER_EMAIL` into the locked "Enter the Hearth" screen. This issues a Supabase passwordless OTP.
- **Verification:** The client captures the magic link session redirect, extracts the JWT, and verifies the user's UUID and email server-side via the secure `/api/auth/me` endpoint.
- **Request-Scoped Client:** For secure backend ledger requests, the server provisions request-scoped Supabase client instances using the parsed `Authorization: Bearer <JWT>` header to respect active Row-Level Security (RLS) policies.
- **Lock & Logout Behavior:**
  - Before owner verification, no private data is fetched or rendered, and the Supabase Realtime client is forced into a `LOCKED` state (no subscriptions or broadcasting).
  - On Sign Out, all cached event states, messages, telemetry, local mutations, and session details are cleanly wiped from both local memory and localStorage, resetting the client back to default.

