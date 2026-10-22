# Cloudflare Function Demos

A collection of hands-on demos exploring Cloudflare security and developer features. Built with Next.js and TypeScript, with Cloudflare Pages as the original deployment target.

## Demos

| Demo | Route | What it shows |
| --- | --- | --- |
| WAF actions | `/action-block`, `/action-managedchallenge`, `/action-jschallenge`, `/action-interactivechallenge` | Pages for testing different WAF challenge and block experiences |
| Rate limiting | `/RL2layer` | Rate-limiting demonstration page |
| Waiting Room | `/waiting-room`, `/waiting-room-json` | Waiting Room UI and JSON response endpoint |
| HMAC | `/hmac`, `/hmac-with-workers` | Signed-path generation and verification examples |
| Turnstile + D1 | `/` and `/api/submit` | Turnstile verification before storing a submitted name in D1 |
| R2 upload | `/` and `/api/upload` | File upload to R2 using its S3-compatible API |
| Session revocation | `/api/revoke-session` | Endpoint for a session-revocation demonstration |

Some demos require matching Cloudflare rules, services, or credentials configured outside this repository. The pages alone do not enable the corresponding Cloudflare product behavior.

## Stack

- Next.js 14, React 18, TypeScript
- Cloudflare Pages and Wrangler
- Cloudflare Turnstile, D1, R2
- AWS SDK for JavaScript (R2 S3-compatible API)
- Drizzle ORM

## Project layout

```text
src/app/          Demo pages and API routes
src/db/           D1 schema
src/lib/hmac.ts   HMAC signing and verification helpers
scripts/          Pages build helper
wrangler.toml     Cloudflare Pages configuration and bindings
.dev.vars.example Local secret variable template
```

## Run locally

Requirements: Node.js, npm, and access to the Cloudflare resources needed for the demos you want to test.

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Set your own development credentials in `.dev.vars`. Do not commit that file. The Next.js development server normally runs at `http://localhost:3000`.

The repository includes a D1 binding named `D1DATABASE` and an R2 bucket name in `wrangler.toml`. Replace the example project's Cloudflare resource IDs and names with your own before deploying. Create the D1 `names` table as required by `src/app/api/submit/route.ts`.

For a Pages-compatible build and local preview:

```bash
npm run preview
```

To deploy using the original workflow:

```bash
npm run deploy
```

Cloudflare authentication, project setup, production secrets, D1 bindings, and R2 resources must be configured separately. The commands above describe the original workflow; successful deployment has **not** been reverified against current Cloudflare tooling.

## Security and project status

This is a demonstration project, **not a production-ready application**. Before exposing it publicly, add authentication and server-side file validation/size limits to the upload endpoint, review error responses, and protect any signing endpoints that should not be publicly accessible. Review Cloudflare rules and rate limits for each demo.

The original Next.js 14 / `@cloudflare/next-on-pages` implementation is preserved for reference. The live deployment is pending revalidation. See `PUBLIC_RELEASE_NOTES.md` for the earlier public-release cleanup notes. Never reuse previously exposed credentials.
