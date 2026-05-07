# tools/mcp-server

A Model Context Protocol server that wraps the monorepo's standard Bazel
operations as structured tools an agent can call. The intent is that any
agent (Claude Code, Cursor, etc.) can drop into the repo and use these tools
instead of free-form shell — keeping it inside the boundary-enforced rails
described in `/AGENTS.md`.

## Tools exposed

| Tool | What it does |
|---|---|
| `list_projects`     | Returns every `apps/*` and `libs/*` with its AGENTS.md summary. |
| `build`             | `bazel build <target>` |
| `test`              | `bazel test <target>`. With `affected_only: true`, runs `bazel-diff` against `origin/main` first. |
| `affected`          | Returns affected target list for a given base ref (uses `bazel-diff`). |
| `query`             | Read-only `bazel query`; rejects mutating expressions. |
| `run`               | `bazel run <target>` — restricted to an allowlist parsed from each project's AGENTS.md. |
| `owners`            | Resolve CODEOWNERS for a path. |

## Wiring it up

In your agent's MCP client config:

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

Or for development without Bazel:

```bash
pnpm --filter @monorepo-example/mcp-server start
```
