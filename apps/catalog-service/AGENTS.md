# apps/catalog-service — agent guide

## Purpose
Product catalog REST API. Owns SKUs, product metadata, and price lookups.
Backed by Spring Boot 3 on JDK 21. Listens on `:8080`.

## Owners
- `@org/team-catalog`
- Slack: `#catalog-team`

## Domain
`domain_catalog`. **Allowed dependencies:**
- `//libs/common-domain` (shared backend types)
- `@maven//...` (Spring Boot starters declared in MODULE.bazel)

**Forbidden:**
- `//apps/orders-service/...` — domain boundary violation
- `//apps/storefront/...`, `//apps/admin-console/...` — wrong language *and* wrong domain
- `//libs/ui-kit/...` — frontend-only

If you need data from another service, call its HTTP API; don't import its code.

## Bazel targets
| Task | Command |
|---|---|
| Build | `bazel build //apps/catalog-service` |
| Test  | `bazel test //apps/catalog-service:tests` |
| Run   | `bazel run //apps/catalog-service` |

## Conventions
- Package: `com.example.catalog`.
- Controllers under `com.example.catalog.web`; domain logic under `com.example.catalog.domain`.
- Health check at `/actuator/health` (Spring Boot Actuator).
- New endpoints ship with at least one `@WebMvcTest` slice test.

## Known gotchas
- **Boot 3 launcher class** — `BUILD.bazel` explicitly sets
  `boot_launcher_class = "org.springframework.boot.loader.launch.JarLauncher"`.
  Do not remove. Boot 2's default launcher silently produces a jar that fails
  at runtime.
- **Hot reload** — Spring DevTools fights Bazel's hermetic builds. Use
  `bazel run` and accept full restart, or use `ibazel` for watch mode.
