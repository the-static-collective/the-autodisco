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
