# apps/admin-console — agent guide

## Purpose
Internal ops console. Used by support and merchandising staff to inspect
catalog data and orders. Talks to `catalog-service` and `orders-service` over
HTTP.

## Owners
- `@org/team-ops`
- Slack: `#ops-team`

## Domain
`domain_shopping` (the package_group covers both shopper-facing and
ops-internal frontend apps in this POC; in a real deployment you'd split into
`domain_ops` if it diverges).

**Allowed dependencies:**
- `//libs/ui-kit`
- `//:node_modules/react`, `//:node_modules/react-dom`, etc.

**Forbidden:**
- `//apps/storefront/...` — peer; they don't import each other
- Any `//apps/<service>/...` or `//libs/common-domain` — JVM-only

## Bazel targets
| Task | Command |
|---|---|
| Dev   | `bazel run //apps/admin-console:dev`  (Vite on `:5174`) |
| Build | `bazel build //apps/admin-console:build` |

## Conventions
- Same as storefront: Vite + TS + React 18, API calls in `src/api/`, UI primitives from `@monorepo-example/ui-kit`.
- This is an internal tool — no SEO needs, no public-facing routing concerns.
