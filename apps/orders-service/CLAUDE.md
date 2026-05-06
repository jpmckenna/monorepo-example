# apps/orders-service — agent guide

## Purpose
Order placement and lookup REST API. Spring Boot 3 on JDK 21. Listens on `:8081`.

## Owners
- `@org/team-orders`
- Slack: `#orders-team`

## Domain
`domain_orders`. **Allowed dependencies:**
- `//libs/common-domain`
- `@maven//...`

**Forbidden:**
- `//apps/catalog-service/...` — peer service, talk to it via HTTP, not by importing its types
- `//apps/storefront/...`, `//apps/admin-console/...`, `//libs/ui-kit/...`

## Bazel targets
| Task | Command |
|---|---|
| Build | `bazel build //apps/orders-service` |
| Test  | `bazel test //apps/orders-service:tests` |
| Run   | `bazel run //apps/orders-service` |

## Conventions
- Package: `com.example.orders`.
- Same layered layout as catalog-service: `web/`, `domain/`.
- New endpoints ship with at least one `@WebMvcTest` slice test.

## Known gotchas
- Same Boot 3 launcher caveat as catalog-service.
- Do not put shared models in this package — promote to `//libs/common-domain`
  with a platform-team review.
