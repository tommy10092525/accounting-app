# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

大学生サークル向けの会計アプリ (a university club accounting/reimbursement app). General members submit expense reimbursement requests (立替申請: payer, amount, receipt image, memo); club admins (代表/会計) approve or reject them and manage income/expense/accounting data.

The authoritative product and stack decisions live in `note/方針.md` (product policy) and `note/技術スタック.md` (tech stack) — read these before making architectural decisions, they are not duplicated in full here.

**Not yet implemented** (intentionally deferred, do not assume they exist): authentication/authorization (planned: better-auth + email/password, Gmail-based mail sending), the database layer (planned: Cloudflare D1 + drizzle ORM), and the actual product screens (intro page copy, reimbursement form, admin screens). Currently `apps/web` renders a single placeholder route and `apps/server` exposes only a health-check endpoint.

## Commands

This is a pnpm workspace + turborepo monorepo (`pnpm@9.0.0`, Node >=18). Run commands from the repo root; turbo fans them out to each package.

```sh
pnpm install              # install all workspace deps
pnpm dev                  # turbo run dev — apps/web on :3000 (vite), apps/server on :8787 (wrangler dev)
pnpm build                # turbo run build
pnpm lint                 # turbo run lint (eslint --max-warnings 0 per package)
pnpm check-types          # turbo run check-types (tsc --noEmit per package)
pnpm format                # prettier --write "**/*.{ts,tsx,md}"
```

Scope to a single package with turbo filters, e.g.:

```sh
pnpm exec turbo dev --filter=web
pnpm exec turbo dev --filter=server
pnpm exec turbo build --filter=web
```

Or run a package's own script directly: `pnpm --filter web add <pkg>` / `pnpm --filter server add -D <pkg>`.

There are no test scripts configured anywhere in the repo yet.

## Architecture

### Apps

- `apps/web` — frontend. Vite + React 19 + React Router in **Declarative mode** (`BrowserRouter`/`Routes`/`Route`, not the data/framework router — see `src/main.tsx` / `src/App.tsx`) + Tailwind CSS v4 (`@tailwindcss/vite` plugin, CSS-first config in `src/index.css`, no `tailwind.config.js`) + Tanstack Query (`QueryClientProvider` in `src/main.tsx`) + shadcn ui.
  - shadcn is configured (`components.json`, `src/lib/utils.ts` for `cn()`) but no components have been generated yet. Add them from `apps/web` with `pnpm dlx shadcn@latest add <component>`; they land in `src/components/ui`.
  - Path alias `@/*` → `apps/web/src/*` (set in both `tsconfig.json` and `vite.config.ts`).
  - `VITE_API_URL` (see `.env.example`) points the frontend at the Hono backend; `.env` is gitignored.

- `apps/server` — backend. Hono app targeting Cloudflare Workers, deployed/dev-served via `wrangler` (`wrangler.jsonc`). Entry point `src/index.ts`.
  - No Cloudflare bindings (D1 etc.) are configured yet — they'll be added to `wrangler.jsonc` once the DB layer is implemented.
  - `wrangler.jsonc`'s `compatibility_date` must not be later than the date embedded in the installed `workerd` version (check `node_modules/.pnpm/workerd@<date>...`) or `wrangler dev`/`deploy` fails with "Compatibility date is in the future".

### Hono RPC type-sharing between web and server

This is the piece that ties the two apps together and is easy to break:

- `apps/server/src/index.ts` builds the Hono app as a chained `.get()/.post()/...` call and exports `export type AppType = typeof app;`. The RPC types only work if routes are chained off a single `new Hono()` call (breaking the chain into separate statements loses the route type inference).
- `apps/server/package.json` has `"exports": { ".": "./src/index.ts" }` — it exports its TypeScript *source* directly, no build step. This only resolves because `apps/web` (and `packages/typescript-config/vite.json`) use `"moduleResolution": "Bundler"`.
- `apps/web` depends on `server` as a `workspace:*` **devDependency** (type-only usage) and imports it in `apps/web/src/lib/api.ts`:
  ```ts
  import { hc } from "hono/client";
  import type { AppType } from "server";
  export const apiClient = hc<AppType>(import.meta.env.VITE_API_URL);
  ```
- If you add real endpoints to `apps/server`, `apiClient` in `apps/web` picks up the new routes' types automatically — no codegen step needed.

### Shared packages

- `packages/eslint-config` — `base.js` (generic TS/JS) and `react-internal.js` (adds React/React-hooks rules; used by `apps/web`). Exposed via `@repo/eslint-config/base` and `@repo/eslint-config/react-internal`.
- `packages/typescript-config` — `base.json` (shared strict compiler options), `vite.json` (Bundler resolution + JSX, extended by `apps/web`), `workers.json` (Bundler resolution + `@cloudflare/workers-types`, no DOM lib, extended by `apps/server`).

There is no shared UI package (`packages/ui` was removed) — shadcn components live directly in `apps/web` since there is currently only one frontend app.
