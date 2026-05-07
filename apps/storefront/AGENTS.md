# apps/storefront — agent guide

## Purpose
Customer-facing storefront. Renders the product catalog (talks to
`catalog-service` over HTTP) and lets shoppers add items to a cart and place
orders against `orders-service`.

## Owners
- `@org/team-shopping`
- Slack: `#shopping-team`

## Domain
`domain_shopping`. **Allowed dependencies:**
- `//libs/ui-kit`
- `//:node_modules/react`, `//:node_modules/react-dom`, `//:node_modules/<pkg>` for any pnpm-managed package

**Forbidden:**
- `//apps/admin-console/...`, `//apps/catalog-service/...`, `//apps/orders-service/...`
- `//libs/common-domain/...` — JVM-only

Talk to backend services over HTTP. Do not import from them.

## Bazel targets
| Task | Command |
|---|---|
| Dev   | `bazel run //apps/storefront:dev`  (Vite on `:5173`) |
| Build | `bazel build //apps/storefront:build` |

## Conventions
- Vite + TS + React 18.
- API calls go through `src/api/` — one file per upstream service.
- All shared visual primitives come from `@monorepo-example/ui-kit`. Don't reinvent.
