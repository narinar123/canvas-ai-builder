# Lovable Agent Builder

A production-oriented, Lovable-style AI application builder. The interface combines a conversational
agent, live preview, code editor, connector catalog, and publish controls in one focused workspace.

The app works immediately with its deterministic demo agent. Add OpenRouter, n8n, and Vercel
credentials to enable live model generation, workflow event delivery, and production publishing.

## Product capabilities

- Conversational project generation with complete HTML, CSS, and JavaScript files
- Live sandboxed preview and editable generated source
- Persistent project files in browser local storage
- OpenRouter-powered agent generation with a polished offline fallback
- Connector catalog modeled after modern app-builder integrations
- Optional n8n workflow events with signed webhook payloads
- Optional Vercel deploy hook or Deployment API publishing
- Zod-validated API boundaries and typed integration errors

## Stack

- Next.js 16 App Router and React 19
- TypeScript with strict compiler settings
- Zod for request, response, and generated-project contracts
- `ky` for resilient outbound HTTP calls
- Vitest for unit tests and Biome for linting/formatting
- Vercel for production hosting

## Setup

Requirements: Node.js 22+ and pnpm 11.5.0.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. No environment variables are required for the demo experience.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | No | Enables live AI project generation. |
| `OPENROUTER_MODEL` | No | Selects an OpenRouter model; defaults to `anthropic/claude-sonnet-4.6`. |
| `N8N_WEBHOOK_URL` | No | Receives builder workflow events. |
| `N8N_WEBHOOK_SECRET` | No | Signs n8n request bodies with an HMAC SHA-256 signature. |
| `VERCEL_DEPLOY_HOOK_URL` | No | Queues a Vercel deployment through a deploy hook. |
| `VERCEL_TOKEN` | No | Authorizes direct Vercel Deployment API requests. |
| `VERCEL_TEAM_ID` | No | Targets a Vercel team when using the Deployment API. |
| `VERCEL_PROJECT_ID` | No | Selects the project for direct Deployment API publishing. |

Keep secrets in `.env.local` for development and configure them in Vercel project settings for
production. Never expose these values through `NEXT_PUBLIC_` variables.

## Architecture

```text
Browser workspace
  ├─ Agent panel ─────────── POST /api/agent ───── OpenRouter or demo agent
  ├─ Preview + code editor ─ generated file state ─ browser local storage
  ├─ Connector catalog
  └─ Publish control ─────── POST /api/publish ─── Vercel hook/API or demo publish

External automation ─────── POST /api/workflows ─ n8n webhook or demo delivery
```

The API routes parse all untrusted input with schemas from `src/lib/contracts.ts`. OpenRouter output
is parsed twice: first as provider output and then as the app's generated-project contract. The
browser only accepts agent responses that satisfy the same contract before updating the preview.

## Integration behavior

### Agent generation

`POST /api/agent` accepts a project name, instruction, and current generated files. When
`OPENROUTER_API_KEY` is configured, the route asks OpenRouter for a structured complete project.
Without a key, it returns the deterministic demo project so the full builder flow remains usable.

### n8n workflows

`POST /api/workflows` accepts `generation.started`, `generation.completed`, or
`deployment.requested`. When `N8N_WEBHOOK_URL` is configured, the server sends an event envelope with
a unique ID and timestamp. If `N8N_WEBHOOK_SECRET` is set, the body is signed in the
`x-lovable-signature` header. Without a webhook, the route acknowledges a demo delivery.

### Vercel publishing

`POST /api/publish` uses the first available publishing strategy:

1. `VERCEL_DEPLOY_HOOK_URL`
2. `VERCEL_TOKEN` plus `VERCEL_PROJECT_ID`
3. Demo publish response

Configure either production strategy in Vercel. Direct API publishing optionally uses
`VERCEL_TEAM_ID`.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```

The GitHub Actions workflow runs those checks and performs the production build remotely on every
push and pull request.

## Deployment

Import the repository into Vercel, add the desired environment variables, and deploy. The repository
includes `vercel.json` with the Next.js framework preset and `iad1` region configuration. Git
integration automatically creates preview deployments for pull requests and production deployments
from the configured production branch.
