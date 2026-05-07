# libs/ui-kit — agent guide

## Purpose
The shared React/TS design system. Buttons, layout primitives, and the design
tokens both `storefront` and `admin-console` consume.

## Owners
- `@org/team-design-system` (primary)
- `@org/team-shopping`, `@org/team-ops` (consumers, co-owners)
- Slack: `#design-system`

## Domain
`shared_frontend`. May be depended on **only** by:
- `//apps/storefront/...`
- `//apps/admin-console/...`

Never depend on application code in this lib — apps depend on the lib, not the
other way around.

## Bazel targets
| Task | Command |
|---|---|
| Build | `bazel build //libs/ui-kit` |
| Type-check | `bazel build //libs/ui-kit` (ts_project does typecheck) |

## Conventions
- One component per file, named identically (e.g. `Button.tsx` exports `Button`).
- Stateless, presentational only. Domain logic lives in apps, not here.
- Export everything through `src/index.ts`.

## Forbidden
- No fetch / network calls. UI primitives only.
- No app-specific names (no `OrderButton`, `CatalogList`, etc.) — those live in their apps.
- No React Router / app-shell concerns.
