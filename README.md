# AllTheCalls Portal

Mobile-first backend portal for AllTheCalls clients. Each client logs in and sees only their
AI receptionist's call history, recordings, transcripts, and summaries — filtered server-side
by their Trillet agent ID.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS · Dark "Midnight Intelligence" theme
- HMAC-signed JWT-style session cookies (no external auth deps)
- Trillet AI API (v1 list/detail, v2 export-csv)

## Local dev

```bash
cp .env.example .env.local
# fill in TRILLET_API_KEY, TRILLET_WORKSPACE_ID, SESSION_SECRET, DEMO_*
npm install
npm run dev
```

## Routes

| Path | Description |
|------|-------------|
| `/login` | Email + password sign-in |
| `/` | Stats + recent calls |
| `/calls` | All calls for the signed-in agent |
| `/calls/[id]` | Call detail · recording · summary · transcript |
| `/api/export` | CSV download via Trillet v2 export-csv |

## Auth model

Currently a single demo user defined by env vars (`DEMO_EMAIL`, `DEMO_PASSWORD`,
`DEMO_AGENT_ID`, `DEMO_FLOW_ID`, `DEMO_CLIENT_NAME`). Session is an HMAC-signed
cookie containing the agent ID — every Trillet API call filters by the session's
`agentId`.

For multi-tenant production, swap `app/api/login/route.ts` for Supabase Auth and
look up the client's `trillet_agent_id` from the `clients` table to populate the session.
