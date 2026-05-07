#!/usr/bin/env python3
"""CODEOWNERS-aware boundary check.

Layer (c) of the 3-layer boundary enforcement story. Visibility (layer a)
catches direct cross-domain `deps`. CODEOWNERS (layer b) routes review.
This script catches transitive *source* imports — e.g., a re-exporting
`java_library` that smuggles a foreign domain's symbols into the public surface.

Modes:
  --staged     Check only files staged for commit (used by lefthook pre-commit).
  --base REF   Check the diff between REF and HEAD (used by CI).
  (default)    Check the entire tree.

Algorithm:
  1. Parse boundaries.yml — domain -> {paths, may_depend_on}.
  2. Parse CODEOWNERS — path -> owning teams.
  3. For each app domain, ask `bazel query` for the set of source files in its
     transitive deps. Strip out files in its own paths and its allowed
     dependency domains. Anything left is a violation; report file + owners.
"""

from __future__ import annotations

import argparse
import os
import pathlib
import subprocess
import sys

try:
    import yaml
except ImportError:  # noqa: BLE001
    sys.stderr.write(
        "PyYAML required: pip install pyyaml  (or run via `bazel run //tools/boundary:check`)\n"
    )
    sys.exit(2)


REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]


def load_boundaries() -> dict:
    return yaml.safe_load((REPO_ROOT / "tools/boundary/boundaries.yml").read_text())


def load_codeowners() -> list[tuple[str, list[str]]]:
    rules: list[tuple[str, list[str]]] = []
    for line in (REPO_ROOT / "CODEOWNERS").read_text().splitlines():
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        parts = line.split()
        pattern, owners = parts[0], parts[1:]
        rules.append((pattern, owners))
    return rules


def owners_for(path: str, rules: list[tuple[str, list[str]]]) -> list[str]:
    matched: list[str] = []
    for pattern, owners in rules:
        # Simple prefix match — sufficient for the POC's CODEOWNERS shape.
        if pattern == "*" or path.startswith(pattern.lstrip("/")):
            matched = owners
    return matched


def domain_for_path(path: str, domains: dict) -> str | None:
    for name, spec in domains.items():
        for prefix in spec.get("paths", []) or []:
            if path.startswith(prefix):
                return name
    return None


def changed_files(args: argparse.Namespace) -> list[str] | None:
    if args.staged:
        out = subprocess.check_output(
            ["git", "diff", "--cached", "--name-only"], cwd=REPO_ROOT, text=True
        )
        return [p for p in out.splitlines() if p]
    if args.base:
        out = subprocess.check_output(
            ["git", "diff", "--name-only", f"{args.base}...HEAD"],
            cwd=REPO_ROOT,
            text=True,
        )
        return [p for p in out.splitlines() if p]
    return None


def find_violations(domains: dict) -> list[tuple[str, str, str]]:
    """Returns (offending_domain, foreign_domain, file_path) triples."""
    violations: list[tuple[str, str, str]] = []
    for domain, spec in domains.items():
        if not spec.get("paths"):
            continue
        allowed = {domain, *(spec.get("may_depend_on") or [])}
        for prefix in spec["paths"]:
            label = f"//{prefix.rstrip('/')}/..."
            try:
                out = subprocess.check_output(
                    ["bazel", "query", f'kind("source file", deps({label}))', "--output=label"],
                    cwd=REPO_ROOT,
                    text=True,
                    stderr=subprocess.DEVNULL,
                )
            except (FileNotFoundError, subprocess.CalledProcessError) as e:
                print(f"Error running bazel query for {domain}: {e}", file=sys.stderr)
                sys.exit(1)
            for label in out.splitlines():
                if not label.startswith("//"):
                    continue
                file_path = label[2:].replace(":", "/")
                d = domain_for_path(file_path, domains)
                if d is None or d in allowed:
                    continue
                violations.append((domain, d, file_path))
    return violations


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--staged", action="store_true")
    p.add_argument("--base")
    args = p.parse_args()

    boundaries = load_boundaries()
    domains = boundaries["domains"]
    codeowners = load_codeowners()
    diff = changed_files(args)

    violations = find_violations(domains)
    if diff is not None:
        diff_set = set(diff)
        modified_domains = {domain_for_path(p, domains) for p in diff_set}
        violations = [v for v in violations if v[0] in modified_domains]

    if not violations:
        print("boundary check: OK")
        return 0

    print("boundary check: VIOLATIONS")
    for offending, foreign, path in violations:
        owners = owners_for(path, codeowners)
        owner_str = ", ".join(owners) if owners else "(no owner)"
        print(f"  {offending} cannot depend on {foreign}")
        print(f"    file:   {path}")
        print(f"    owners: {owner_str}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
