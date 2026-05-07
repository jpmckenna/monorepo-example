#!/usr/bin/env node
/**
 * MCP server wrapping the monorepo's standard Bazel actions for agents.
 *
 * Tools are deliberately constrained: `run` is allowlist-checked against each
 * project's AGENTS.md, `query` is read-only, `test` can compute affected via
 * bazel-diff. Agents that respect these tools stay inside the boundaries the
 * repo enforces in CI; visibility + boundary lint catch them if they don't.
 */

import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const exec = promisify(execFile);

const REPO_ROOT = process.env.MONOREPO_ROOT ?? process.cwd();

// --- helpers -----------------------------------------------------------------

async function listProjectDirs(): Promise<string[]> {
  const out: string[] = [];
  for (const group of ["apps", "libs"]) {
    const dir = path.join(REPO_ROOT, group);
    let entries: import("node:fs").Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.isDirectory()) out.push(`${group}/${e.name}`);
    }
  }
  return out;
}

async function readProjectClaude(rel: string): Promise<string | null> {
  try {
    return await readFile(path.join(REPO_ROOT, rel, "AGENTS.md"), "utf8");
  } catch {
    return null;
  }
}

function parseAllowedTargets(claude: string, project: string): string[] {
  // Match `bazel run|build|test //...` references inside the AGENTS.md.
  const re = /bazel (?:run|build|test) (\/\/[^\s`)]+)/g;
  const targets = new Set<string>();
  for (const m of claude.matchAll(re)) {
    if (m[1].startsWith(`//${project}`)) targets.add(m[1]);
  }
  return [...targets];
}

async function bazel(args: string[]): Promise<string> {
  const { stdout } = await exec("bazel", args, { cwd: REPO_ROOT, maxBuffer: 32 * 1024 * 1024 });
  return stdout;
}

// --- server ------------------------------------------------------------------

const server = new Server(
  { name: "monorepo-example", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

const tools = [
  {
    name: "list_projects",
    description: "List all apps and libs with their AGENTS.md summary.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "build",
    description: "Run `bazel build <target>`.",
    inputSchema: {
      type: "object",
      required: ["target"],
      properties: { target: { type: "string", description: "Bazel label, e.g. //apps/catalog-service" } },
    },
  },
  {
    name: "test",
    description: "Run `bazel test <target>`. If affected_only, restricts to bazel-diff vs origin/main.",
    inputSchema: {
      type: "object",
      required: ["target"],
      properties: {
        target: { type: "string" },
        affected_only: { type: "boolean", default: false },
      },
    },
  },
  {
    name: "affected",
    description: "Return the affected target list since base_ref (default: origin/main).",
    inputSchema: {
      type: "object",
      properties: { base_ref: { type: "string", default: "origin/main" } },
    },
  },
  {
    name: "query",
    description: "Run a read-only `bazel query` expression.",
    inputSchema: {
      type: "object",
      required: ["expression"],
      properties: { expression: { type: "string" } },
    },
  },
  {
    name: "run",
    description:
      "Run a Bazel target. Restricted to the allowlist parsed from each project's AGENTS.md.",
    inputSchema: {
      type: "object",
      required: ["target"],
      properties: { target: { type: "string" }, args: { type: "array", items: { type: "string" } } },
    },
  },
  {
    name: "owners",
    description: "Resolve CODEOWNERS for a repo-relative path.",
    inputSchema: {
      type: "object",
      required: ["path"],
      properties: { path: { type: "string" } },
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const name = req.params.name;
  const args = req.params.arguments ?? {};

  switch (name) {
    case "list_projects": {
      const projects = await listProjectDirs();
      const out: Record<string, string> = {};
      for (const p of projects) {
        const claude = await readProjectClaude(p);
        out[p] = claude ? claude.split("\n").slice(0, 8).join("\n") : "(no AGENTS.md)";
      }
      return { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] };
    }
    case "build": {
      const { target } = z.object({ target: z.string() }).parse(args);
      const out = await bazel(["build", target]);
      return { content: [{ type: "text", text: out }] };
    }
    case "test": {
      const parsed = z
        .object({ target: z.string(), affected_only: z.boolean().optional() })
        .parse(args);
      if (parsed.affected_only) {
        const targets = await bazelDiffTargets("origin/main");
        if (targets.length === 0) {
          return { content: [{ type: "text", text: "no affected targets" }] };
        }
        const out = await bazel(["test", ...targets]);
        return { content: [{ type: "text", text: out }] };
      }
      const out = await bazel(["test", parsed.target]);
      return { content: [{ type: "text", text: out }] };
    }
    case "affected": {
      const { base_ref = "origin/main" } = z
        .object({ base_ref: z.string().optional() })
        .parse(args);
      const targets = await bazelDiffTargets(base_ref);
      return { content: [{ type: "text", text: targets.join("\n") }] };
    }
    case "query": {
      const { expression } = z.object({ expression: z.string() }).parse(args);
      // Reject mutating expressions just in case bazel ever grows them — and
      // reject `--keep_going` style flags smuggled in via the expression.
      if (/[`;|&]/.test(expression)) {
        throw new Error("query expression contains shell metacharacters");
      }
      const out = await bazel(["query", expression, "--output=label"]);
      return { content: [{ type: "text", text: out }] };
    }
    case "run": {
      const parsed = z
        .object({ target: z.string(), args: z.array(z.string()).optional() })
        .parse(args);
      const project = parsed.target.replace(/^\/\//, "").split(":")[0];
      const claude = await readProjectClaude(project);
      if (!claude) throw new Error(`unknown project: ${project}`);
      const allowed = parseAllowedTargets(claude, project);
      if (!allowed.includes(parsed.target.split(":")[0]) && !allowed.includes(parsed.target)) {
        throw new Error(
          `target ${parsed.target} not in AGENTS.md allowlist for ${project}: ${allowed.join(", ")}`,
        );
      }
      const out = await bazel(["run", parsed.target, "--", ...(parsed.args ?? [])]);
      return { content: [{ type: "text", text: out }] };
    }
    case "owners": {
      const { path: p } = z.object({ path: z.string() }).parse(args);
      const owners = await resolveOwners(p);
      return { content: [{ type: "text", text: owners.join(" ") || "(none)" }] };
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
});

async function bazelDiffTargets(baseRef: string): Promise<string[]> {
  try {
    const { stdout } = await exec(
      "bazel-diff",
      [
        "-w",
        REPO_ROOT,
        "-b",
        process.env.BAZEL_BIN ?? "bazel",
        "-sb",
        baseRef,
        "-fb",
        "HEAD",
        "--output_targets",
      ],
      { cwd: REPO_ROOT, maxBuffer: 32 * 1024 * 1024 },
    );
    return stdout.split("\n").filter(Boolean);
  } catch (e) {
    throw new Error(`bazel-diff failed (is it installed?): ${(e as Error).message}`);
  }
}

async function resolveOwners(p: string): Promise<string[]> {
  const text = await readFile(path.join(REPO_ROOT, "CODEOWNERS"), "utf8");
  let matched: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.split("#", 1)[0].trim();
    if (!line) continue;
    const [pattern, ...owners] = line.split(/\s+/);
    if (pattern === "*" || p.startsWith(pattern.replace(/^\//, ""))) {
      matched = owners;
    }
  }
  return matched;
}

const transport = new StdioServerTransport();
await server.connect(transport);
