# monorepo-example

[![ci](https://github.com/jpmckenna/monorepo-example/actions/workflows/ci.yml/badge.svg)](https://github.com/jpmckenna/monorepo-example/actions/workflows/ci.yml)

A Bazel-based polyglot monorepo proof-of-concept for an enterprise React + Java
Spring Boot ecommerce org. The POC demonstrates four things a monorepo migration
should buy you:

1. **Application management at scale** — clean ownership, a visible project
   graph, predictable per-project commands.
2. **Compliance** — `CODEOWNERS` review routing **plus** machine-enforced
   cross-domain boundary lint. Three layers, all visible in CI.
3. **Build acceleration** — incremental + remote cache wins on a polyglot
   graph; affected-only CI on PRs.
4. **Agentic-development readiness** — per-project `CLAUDE.md`, an MCP server
   wrapping standard build/test/run tasks, and ownership/visibility constraints
   that contain agent edits.

## Stack

- **Bazel 7.4.1** with bzlmod (`MODULE.bazel`)
- **`aspect_rules_js`** + **`aspect_rules_ts`** for the React/TS apps and libs (pnpm-backed)
- **`rules_spring`** (Salesforce) for Spring Boot 3 fat-jars
- **`rules_jvm_external`** for Maven dependency resolution
- **`rules_oci`** for container images
- **GitHub Actions** for CI, with **BuildBuddy** free-tier remote cache + BES
- **lefthook** for pre-commit / pre-push hooks
- **Tinder/bazel-diff** for affected-target computation

## Layout

```
apps/
  storefront/         React  — domain: shopping
  admin-console/      React  — domain: ops
  catalog-service/    Spring — domain: catalog
  orders-service/     Spring — domain: orders
libs/
  ui-kit/             shared React/TS design system
  common-domain/      shared Java types
tools/
  boundary/           CODEOWNERS-aware boundary lint
  mcp-server/         MCP server exposing build/test/affected/run
```

Every project ships its own `CLAUDE.md`, `OWNERS`, and `BUILD.bazel`.

## Getting started

```bash
# One-time setup
brew install bazelisk pnpm lefthook
pnpm install
bazel run @maven//:pin
lefthook install

# Build / test
bazel build //...
bazel test //...

# Run a frontend or service
bazel run //apps/storefront:dev          # http://localhost:5173
bazel run //apps/catalog-service         # http://localhost:8080
bazel run //apps/orders-service          # http://localhost:8081
```

For the remote cache, drop a BuildBuddy API key into `.bazelrc.user`:

```
build --remote_header=x-buildbuddy-api-key=YOUR_KEY
```

Alternatives: EngFlow (paid, faster RBE) or self-hosted `bazel-remote`.

## Walkthrough

A guided tour of what working in this monorepo actually looks like — first
day-to-day on a workstation, then what happens at the CI layer. Each scenario
calls out which of the four POC goals it proves out: **management**,
**compliance**, **acceleration**, **agentic**.

### Local development

#### 1. Build, test, and run anything — same shape for every project

```bash
bazel build //...                          # everything
bazel test  //apps/catalog-service:tests   # one project
bazel run   //apps/storefront:dev          # Vite dev server  → http://localhost:5173
bazel run   //apps/catalog-service          # Spring Boot     → http://localhost:8080
bazel run   //apps/orders-service           # Spring Boot     → http://localhost:8081
```

The same four verbs work for every project, regardless of language. There's no
per-stack muscle memory (`mvn` here, `pnpm run` there, `gradle bootRun` over
yonder) — that consistency is the foundation everything else builds on.

> **Goals:** management, agentic readiness.

#### 2. Visualize the project graph

```bash
bazel query 'deps(//apps/storefront/...)' --output=graph | dot -Tpng | open -f -a Preview
bazel query 'somepath(//apps/storefront/..., //apps/orders-service/...)'
# → empty: there is no path between these.
```

The first command renders the dependency DAG: `storefront → ui-kit → react`.
The second is the more interesting one — it asks "is there a path between
storefront and orders-service?" and returns nothing, which is exactly the
boundary you want.

> **Goals:** management, compliance.

#### 3. Cold-cache vs. warm-cache build (single workstation)

```bash
$ bazel clean --expunge && time bazel build //...
INFO: Build completed successfully, 412 total actions.
real    1m52.314s

$ time bazel build //...
INFO: Build completed successfully, 0 actions executed.
real    0m0.612s
```

Now repeat on a fresh clone with a BuildBuddy key set in `.bazelrc.user`:

```bash
$ git clone <repo> && cd monorepo-example && time bazel build //...
INFO: 412 actions: 408 remote cache hit, 4 internal.
real    0m7.480s
```

The remote cache turns a two-minute cold build into a ~7-second one for
anybody who pulls a commit a teammate already built.

> **Goal:** build acceleration.

#### 4. Affected-only test loop

You're touching `libs/ui-kit/src/Button.tsx`. Don't run all tests — run only
what the change affected:

```bash
$ bazel-diff -w "$(pwd)" -b "$(which bazel)" \
    -sb origin/main -fb HEAD --output_targets
//libs/ui-kit:ui-kit
//apps/storefront:storefront_lib
//apps/storefront:build
//apps/admin-console:admin_console_lib
//apps/admin-console:build

$ bazel-diff … --output_targets | xargs bazel test
```

A Java change does the inverse — only the affected services and their tests
run. The Spring-side and React-side stay independent on PRs that only touch
one or the other.

> **Goal:** acceleration.

#### 5. Try to break a domain boundary — layer (a), visibility

Add a forbidden direct dep to a `BUILD.bazel`:

```python
# apps/storefront/BUILD.bazel
ts_project(
    name = "storefront_lib",
    deps = ["//apps/orders-service:orders_lib"],   # try this
)
```

```
$ bazel build //apps/storefront:storefront_lib
ERROR: in deps attribute of ts_project rule //apps/storefront:storefront_lib:
target '//apps/orders-service:orders_lib' is not visible from target
'//apps/storefront:storefront_lib'.
```

Build fails immediately. Revert the line.

> **Goal:** compliance.

#### 6. Try to break a boundary — layer (c), transitive source import

Visibility catches direct edges, but a re-exporting library could smuggle a
foreign domain's types through. The Python boundary check catches that before
merge:

```bash
$ python3 tools/boundary/check_boundaries.py --base origin/main
boundary check: VIOLATIONS
  domain_shopping cannot depend on domain_orders
    file:   apps/orders-service/src/main/java/com/example/orders/web/OrderController.java
    owners: @org/team-orders
```

You get the offending domain pair, the file that triggered it, and exactly who
needs to weigh in. The same script runs as a required check in CI
(`boundary.yml`).

> **Goal:** compliance.

#### 7. Pre-commit and pre-push gates

Stage a poorly-formatted file and try to commit:

```bash
$ git commit -m "tweak button"
prettier              ✓  (formatted, re-staged)
buildifier            ✓
google-java-format    ✓
boundary-check        ✓
[main abc1234] tweak button
```

`lefthook` runs the formatters, re-stages the fixed files, and runs the
boundary check before the commit lands. On `git push`, the affected-tests gate
runs `bazel-diff` and tests only what changed — so problems an agent could
introduce get caught on the workstation, not on CI.

> **Goals:** compliance, agentic readiness.

#### 8. Drive a task through the MCP server (agentic)

Wire the MCP server into Claude Code (or any MCP client):

```jsonc
{
  "mcpServers": {
    "monorepo-example": {
      "command": "bazel",
      "args": ["run", "//tools/mcp-server", "--"],
      "env": { "MONOREPO_ROOT": "/path/to/monorepo-example" }
    }
  }
}
```

A typical agent flow looks like:

```
> list_projects()
{
  "apps/catalog-service":  "Product catalog REST API. Owner: @org/team-catalog. Domain: domain_catalog. Allowed: //libs/common-domain.",
  "apps/orders-service":   "Order placement and lookup REST API. Owner: @org/team-orders. Domain: domain_orders. Allowed: //libs/common-domain.",
  ...
}

> test({ target: "//apps/catalog-service:tests" })
ProductControllerTest.returnsKnownProduct          ✓
ProductControllerTest.returnsNotFoundForUnknownSku ✗  expected 404, got 500

(agent reads CLAUDE.md and the failing test; edits ProductController.java)

> test({ target: "//apps/catalog-service:tests" })
all tests pass
```

If the agent ever tries `run({ target: "//apps/orders-service" })` from a
catalog task, the allowlist parsed from `apps/catalog-service/CLAUDE.md`
rejects it. And even if the agent bypassed the MCP server entirely,
visibility (layer a) and the boundary check (layer c) would still block a
cross-domain edit before merge.

> **Goal:** agentic readiness.

---

### CI layer

Three GitHub Actions workflows back the local-dev story. Each demonstrates a
different POC goal. The descriptions below assume `BB_KEY` (BuildBuddy) is set
as a repo secret.

#### 1. PR with a frontend-only change → affected-only test run

A PR that only touches `libs/ui-kit/src/Button.tsx` triggers `pr.yml`:

```
$ bazel-diff … --output_targets > impacted_targets.txt
$ bazel test --target_pattern_file=impacted_targets.txt \
    --remote_cache=grpcs://remote.buildbuddy.io \
    --remote_header=x-buildbuddy-api-key=$BB_KEY

INFO: 5 targets affected.
INFO: 412 processes: 405 remote cache hit, 7 linux-sandbox.
INFO: Build completed successfully, 5 tests pass.
```

Only the React-side targets run. The Java services are completely skipped. With
remote cache warm, the entire PR job finishes in well under a minute.

> **Goal:** build acceleration.

#### 2. PR with a forbidden import → `boundary.yml` fails

A PR adds a cross-domain import (intentionally, as a demo, or accidentally,
via an autocomplete mishap). On push:

```
$ python tools/boundary/check_boundaries.py --base origin/main
boundary check: VIOLATIONS
  domain_shopping cannot depend on domain_orders
    file:   apps/orders-service/src/main/java/com/example/orders/web/OrderController.java
    owners: @org/team-orders
##[error]Process completed with exit code 1.
```

The job is wired as a required check in branch protection — the PR cannot
merge until either the import is removed or `tools/boundary/boundaries.yml`
is updated to allow the new edge (which itself routes a CODEOWNERS review to
the platform team).

> **Goal:** compliance.

#### 3. PR that legitimately touches two domains → CODEOWNERS routing

A PR that modifies both `libs/ui-kit/Button.tsx` and `libs/common-domain/Sku.java`
auto-requests reviews from:

| Path                     | Required reviewers                                          |
| ------------------------ | ----------------------------------------------------------- |
| `libs/ui-kit/`           | `@org/team-design-system @org/team-shopping @org/team-ops`  |
| `libs/common-domain/`    | `@org/team-platform @org/team-catalog @org/team-orders`     |

GitHub blocks merge until at least one reviewer from each owner group has
approved. No human had to remember which teams to ping — the routing is
mechanical, sourced from `CODEOWNERS`.

> **Goals:** management, compliance.

#### 4. Merge to `main` populates the remote cache

```yaml
# .github/workflows/ci.yml
- name: bazel test //...
  run: |
    bazel test //... \
      --remote_cache=grpcs://remote.buildbuddy.io \
      --remote_header=x-buildbuddy-api-key=$BB_KEY \
      --bes_backend=grpcs://remote.buildbuddy.io
```

Every action's output is uploaded to BuildBuddy. When the next teammate
clones the repo at that commit and runs `bazel build //...`, almost every
action is a cache hit — minutes become seconds.

> **Goal:** build acceleration.

#### 5. Cache-hit telemetry is observable on every CI run

Every invocation prints a Build Event Service URL:

```
INFO: Streaming Build Event Protocol to grpcs://remote.buildbuddy.io
INFO: Build Event Service results: https://app.buildbuddy.io/invocation/abcd-1234
INFO: 412 processes: 408 remote cache hit, 4 internal.
```

The 4 misses are exactly the actions affected by this PR; the rest were free.
Anyone can open the BES link and inspect timings, action graphs, and flaky
tests. This makes the cache value concrete instead of folklore — engineering
managers can point to actual minute-savings per merge.

> **Goal:** build acceleration; observable proof of (1) and (4).

## Boundary enforcement (3 layers)

| Layer | Mechanism | Catches |
|---|---|---|
| (a) | Bazel `visibility` + `package_group` in `//:BUILD.bazel` | Direct cross-domain `deps` |
| (b) | `CODEOWNERS` + GitHub branch-protection required reviewers | Human review escalation |
| (c) | `tools/boundary/check_boundaries.py` over `bazel query` output | Transitive source imports past re-exports |

See `CLAUDE.md` for the agent-facing version.

## CI

- `.github/workflows/pr.yml` — affected-only test on PRs (uses `bazel-diff`).
- `.github/workflows/ci.yml` — full `bazel test //...` on `main`; populates the remote cache.
- `.github/workflows/boundary.yml` — required check that runs the boundary script and fails hard on violations.

## What this POC is not

- It's not a production migration template — leans toward clarity over completeness.
- Not every Bazel best practice is wired up (e.g. no remote-execution, no
  `rules_oci` image push wiring beyond a sketch). Add as needed.
- The `pnpm-lock.yaml` and `third_party/maven_install.json` are generated by
  the one-time setup commands above; they are not committed as fully-resolved
  artifacts in this scaffold.
