# libs/common-domain — agent guide

## Purpose
Shared Java domain primitives — value types, IDs, error classes — used by
`catalog-service` and `orders-service`. Keeps these services from drifting on
their representations of money, SKUs, and the like.

## Owners
- `@org/team-platform` (primary)
- `@org/team-catalog`, `@org/team-orders` (consumers, co-owners)
- Slack: `#monorepo-platform`

## Domain
`shared_backend`. May be depended on **only** by:
- `//apps/catalog-service/...`
- `//apps/orders-service/...`

Frontend (`storefront`, `admin-console`) and frontend libs (`ui-kit`) must never
depend on this — they live in JS, not the JVM.

## Bazel targets
| Task | Target |
|---|---|
| Build | `bazel build //libs/common-domain` |
| Test  | `bazel test //libs/common-domain:tests` |

## Conventions
- Package: `com.example.common`.
- Prefer `record` types for value objects (Java 21).
- No Spring, no Jackson — keep this layer framework-free.
- Any new public type ships with a unit test under `src/test/java/`.

## Forbidden
- No Spring imports.
- No `org.json`, `com.fasterxml.jackson.*` — serialization belongs to consumers.
- No new `maven` deps without a platform-team review.
