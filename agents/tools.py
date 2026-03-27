"""File-system and build tools available to agents."""

from __future__ import annotations

import subprocess
from pathlib import Path

from langchain_core.tools import tool

ROOT = Path(__file__).resolve().parents[1]


@tool
def read_file(path: str) -> str:
    """Read and return the contents of a file. Path is relative to the repo root."""
    target = (ROOT / path).resolve()
    if not target.is_file():
        return f"ERROR: {path} not found"
    return target.read_text()


@tool
def list_directory(path: str = "src") -> str:
    """List files in a directory (relative to repo root). Returns one path per line."""
    target = (ROOT / path).resolve()
    if not target.is_dir():
        return f"ERROR: {path} is not a directory"
    entries = sorted(p.relative_to(ROOT) for p in target.rglob("*") if p.is_file())
    return "\n".join(str(e) for e in entries)


@tool
def write_file(path: str, content: str) -> str:
    """Write content to a NEW file. Path is relative to the repo root. Creates dirs as needed. Fails if file exists."""
    target = (ROOT / path).resolve()
    if target.is_file():
        return f"ERROR: {path} already exists — use patch_file to modify existing files"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)
    return f"Created {path}"


@tool
def patch_file(path: str, search: str, replace: str) -> str:
    """Replace exact text in an existing file. search must match exactly (whitespace matters)."""
    target = (ROOT / path).resolve()
    if not target.is_file():
        return f"ERROR: {path} not found"
    content = target.read_text()
    if search not in content:
        return f"ERROR: search text not found in {path}"
    target.write_text(content.replace(search, replace, 1))
    return f"Patched {path}"


def run_typecheck() -> str:
    """Run tsc --noEmit and return output."""
    r = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=ROOT, capture_output=True, text=True, timeout=60,
    )
    return r.stdout + r.stderr if r.returncode != 0 else ""


def run_lint() -> str:
    """Run eslint and return output."""
    r = subprocess.run(
        ["npx", "eslint", "src/", "--max-warnings", "0"],
        cwd=ROOT, capture_output=True, text=True, timeout=60,
    )
    return r.stdout + r.stderr if r.returncode != 0 else ""
