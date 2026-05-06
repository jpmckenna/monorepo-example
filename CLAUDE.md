# monorepo-example — agent guide

This is a Bazel-based polyglot monorepo POC for a React + Spring Boot org. Read
this file before doing any work; it's the contract between the repo and any
agent (Claude Code or otherwise) editing here.

## How agents should work in this repo

1. Identify the project you're touching (`apps/<name>` or `libs/<name>`).
2. Read that project's local `CLAUDE.md` — it lists the commands, conventions,
   and the explicit set of domains it's allowed to depend on.
3. Use only the Bazel targets the local CLAUDE.md lists. The MCP server in
   `tools/mcp-server/` exposes them as structured tools (`build`, `test`,
   `affected`, `query`, `run`, `owners`, `list_projects`).
4. Never import across domain boundaries. The repo enforces this in three
   layers; you'll fail CI if you try.

## Project index

| Path | Domain | Stack | Purpose |
|---|---|---|---|
| `apps/storefront`      | shopping | React + TS (Vite) | Customer-facing storefront |
| `apps/admin-console`   | ops      | React + TS (Vite) | Internal ops console |
| `apps/catalog-service` | catalog  | Java 21 / Spring Boot 3 | Product catalog API |
| `apps/orders-service`  | orders   | Java 21 / Spring Boot 3 | Orders API |
| `libs/ui-kit`          | shared-frontend | React + TS | Design-system components |
| `libs/common-domain`   | shared-backend  | Java 21 | Shared domain types |
| `tools/boundary`       | platform | Python | CODEOWNERS-aware boundary lint |
| `tools/mcp-server`     | platform | Node TS | MCP server for agent task wrapping |

## Boundary enforcement (compliance)

Three layers, all visible in CI:

1. **Bazel `visibility` + `package_group`** (in `//:BUILD.bazel`) — direct
   cross-domain `deps` fail `bazel build`. Domain groups: `domain_shopping`,
   `domain_catalog`, `domain_orders`, `shared_frontend`, `shared_backend`.
2. **`CODEOWNERS`** — routes review by path; required reviewers are the
   owning team(s).
3. **`tools/boundary/check_boundaries.py`** — reads `CODEOWNERS` plus
   `tools/boundary/boundaries.yml` (declares allowed cross-domain edges) and
   walks `bazel query` output to catch transitive source imports that slip past
   visibility.

If you need shared logic that doesn't exist yet, propose adding it to
`//libs/common-domain` (Java) or `//libs/ui-kit` (TS) and tag the relevant
platform team in CODEOWNERS — don't reach across.

## Standard commands

| Task | Command |
|---|---|
| Build everything | `bazel build //...` |
| Test everything  | `bazel test //...` |
| Test affected (vs main) | `bazel test $(bazel-diff -w . -b $(which bazelisk) -sb $(git rev-parse origin/main) -fb HEAD --output_targets)` |
| Format BUILD files | `bazel run //:buildifier.fix` |
| Boundary check | `python tools/boundary/check_boundaries.py --base origin/main` |
| Project graph (storefront) | `bazel query 'deps(//apps/storefront/...)' --output=graph` |

Per-language specifics live in each project's local `CLAUDE.md`.

## Setup (one-time, after fresh clone)

```bash
brew install bazelisk pnpm lefthook   # macOS
pnpm install                          # populates pnpm-lock.yaml
bazel run @maven//:pin                # generates third_party/maven_install.json
lefthook install                      # wires pre-commit and pre-push hooks
```

For remote cache, copy your BuildBuddy API key into `.bazelrc.user` (gitignored):
```
build --remote_header=x-buildbuddy-api-key=YOUR_KEY
```

See [README.md](README.md) for the full demo script.
