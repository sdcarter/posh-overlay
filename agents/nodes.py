"""Graph node functions — one per agent role."""

from __future__ import annotations

import re
from pathlib import Path

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

from agents.llm import get_llm
from agents.state import AgentState
from agents.tools import list_directory, read_file, write_file, patch_file, run_typecheck, run_lint

_TOOLS_READ = [read_file, list_directory]
_TOOLS_ALL = [read_file, list_directory, write_file, patch_file]
_TOOL_MAP = {t.name: t for t in _TOOLS_ALL}
_MEMORY_DIR = Path(__file__).resolve().parent / "memory"
_MAX_FILE_CHARS = 6000

# ── Context tiers (sized per role to minimize tokens) ────────────────

_PM_CONTEXT = (
    "PoshDash is a transparent always-on-top Electron overlay for iRacing that "
    "displays real-time telemetry. Personal project — utility first, performance "
    "is the product, pragmatic testing, keep it simple.\n"
    "Architecture: hexagonal (domain/application/adapters/main/renderer).\n"
    "Overlay renders as a capsule HUD in Overlay.tsx (no separate Ribbon component)."
)

_SLIM_CONTEXT = (
    "- Hexagonal: domain/ (pure TS), application/ (use cases+ports), "
    "adapters/ (iRacing, mock, GitHub), main/ (Electron), renderer/ (React)\n"
    "- Overlay.tsx renders everything inline — no separate Ribbon component\n"
    "- Ribbon built as lowerItems from frame.ribbon.* in Overlay.tsx\n"
    "- Renderer imports: bundler resolution (no .js). Main: NodeNext (.js)\n"
    "- strict TS, no any, named exports, inline styles, no CSS files\n"
    "- ESLint zero warnings, react-hooks enforced\n"
    "- jsx: react-jsx — do NOT import React for JSX"
)

_CODING_RULES = (
    f"{_SLIM_CONTEXT}\n\n"
    "## Lint rules\n"
    "- strict: true, no implicit any\n"
    "- no-explicit-any: warn, no-unused-vars: warn (prefix with _)\n"
    "- react-hooks enforced, zero warnings\n"
    "- Named exports, `import type {{ X }}`, no new dependencies"
)

# ── System prompts ───────────────────────────────────────────────────

_PM_SYSTEM = (
    f"You are the Product Manager for PoshDash.\n{_PM_CONTEXT}\n\n"
    "Gather product decisions, produce acceptance criteria, delegate to agents."
)

_SDK_SYSTEM = (
    f"You are the SDK Architect for PoshDash.\n{_SLIM_CONTEXT}\n\n"
    "Use list_directory and read_file before responding. "
    "Report ONLY what you find in the actual files — never invent interfaces or types. "
    "Quote exact code from the files you read."
)

_FRONTEND_SYSTEM = (
    f"You are the Frontend Architect for PoshDash.\n{_SLIM_CONTEXT}\n\n"
    "Use list_directory and read_file before responding. "
    "Output exact props, lines to change, and file paths."
)

_QA_SYSTEM = (
    f"You are the QA Agent for PoshDash.\n{_SLIM_CONTEXT}\n\n"
    "Use list_directory and read_file before responding. "
    "Output import conventions, test runner info, and risks."
)

_DEV_SYSTEM = (
    f"You are a senior TypeScript/React developer for PoshDash.\n\n{_CODING_RULES}\n\n"
    "RULES:\n"
    "1. MINIMAL changes only. Do NOT rewrite files from scratch.\n"
    "2. Preserve ALL existing functionality.\n"
    "3. No test files unless requested. No new dependencies.\n\n"
    "WORKFLOW:\n"
    "1. Use list_directory to understand the project structure\n"
    "2. Use read_file to read every file you need to understand\n"
    "3. Use patch_file to make surgical edits to existing files\n"
    "4. Use write_file only for brand new files\n"
    "5. After all changes, summarize what you did"
)

_FIX_SYSTEM = (
    f"You are fixing build errors in PoshDash.\n\n{_CODING_RULES}\n\n"
    "Fix ONLY the errors. No refactoring.\n"
    "Use read_file to see the current file, then patch_file to fix it."
)


# ── Helpers ──────────────────────────────────────────────────────────

def _run_with_tools(llm, messages: list, max_rounds: int = 8, verbose: bool = False) -> str:
    for _ in range(max_rounds):
        resp: AIMessage = llm.invoke(messages)
        if not resp.tool_calls:
            return resp.content or ""
        messages.append(resp)
        for tc in resp.tool_calls:
            tool_fn = _TOOL_MAP.get(tc["name"])
            if tool_fn:
                result = str(tool_fn.invoke(tc["args"]))
                if len(result) > _MAX_FILE_CHARS:
                    result = result[:_MAX_FILE_CHARS] + "\n... [truncated]"
                # Only show write actions, not reads (unless verbose)
                is_write = tc["name"] in ("patch_file", "write_file")
                if verbose and is_write:
                    print(f"    📝 {tc['name']}({tc['args'].get('path', '')}) → {result[:80]}")
            else:
                result = f"Unknown tool: {tc['name']}"
                print(f"    ⚠️  {result}")
            messages.append(ToolMessage(content=result, tool_call_id=tc["id"]))
    return messages[-1].content if messages else ""


def _indent(text: str, prefix: str = "  ") -> str:
    return prefix + text.replace("\n", f"\n{prefix}")


def pm_onboard(state: AgentState) -> dict:
    print("▶ pm_onboard")
    resp = get_llm().invoke([
        SystemMessage(content=_PM_SYSTEM),
        HumanMessage(content=(
            f"The product owner says:\n\n{state.user_request}\n\n"
            "Summarise in 5 bullet points. List available agents: "
            "SDK Architect, Frontend Architect, QA Agent, Developer."
        )),
    ])
    return {"session_plan": resp.content}


def pm_plan(state: AgentState) -> dict:
    print("▶ pm_plan")
    resp = get_llm().invoke([
        SystemMessage(content=_PM_SYSTEM),
        HumanMessage(content=(
            "Produce a session plan. Scale the plan to the size of the change — "
            "a one-line fix needs a one-paragraph plan, not a full spec. Include:\n"
            "- What changes and in which files\n"
            "- Acceptance criteria (bullet list)\n\n"
            f"Request: {state.user_request}\n\nSummary: {state.session_plan}"
        )),
    ])
    print(f"\n{'─' * 60}\n📋 SESSION PLAN:\n{'─' * 60}")
    print(resp.content)
    print(f"{'─' * 60}\n")
    return {"session_plan": resp.content}


def sdk_orient(state: AgentState) -> dict:
    print("▶ sdk_orient")
    result = _run_with_tools(
        get_llm().bind_tools([read_file, list_directory]),
        [SystemMessage(content=_SDK_SYSTEM),
         HumanMessage(content=(
             "First list_directory('src/domain') and list_directory('src/application') "
             "to find the relevant files. Read the ones related to this change. "
             "Then concisely (under 300 words):\n"
             "1. 3-bullet current state relevant to this change\n"
             "2. Exact interfaces/types the developer must conform to\n"
             "3. FILES TO READ: <paths>\n"
             "4. FILES TO MODIFY: <paths>\n\n"
             f"Plan:\n{state.session_plan}"
         ))],
    )
    print(f"\n  🏗️  SDK Architect:\n{_indent(result)}\n")
    return {"orient_reports": [f"## SDK Architect\n{result}"]}


def frontend_orient(state: AgentState) -> dict:
    print("▶ frontend_orient")
    result = _run_with_tools(
        get_llm().bind_tools([read_file, list_directory]),
        [SystemMessage(content=_FRONTEND_SYSTEM),
         HumanMessage(content=(
             "First list_directory('src/renderer') to find the relevant files. "
             "Read the ones related to this change. "
             "Then concisely (under 300 words):\n"
             "1. Exact props/interfaces for touched components\n"
             "2. Quote the EXACT lines that need to change\n"
             "3. FILES TO READ: <paths>\n"
             "4. FILES TO MODIFY: <paths>\n\n"
             f"Plan:\n{state.session_plan}"
         ))],
    )
    print(f"\n  🎨 Frontend Architect:\n{_indent(result)}\n")
    return {"orient_reports": [f"## Frontend Architect\n{result}"]}


def qa_orient(state: AgentState) -> dict:
    print("▶ qa_orient")
    result = _run_with_tools(
        get_llm().bind_tools([read_file, list_directory]),
        [SystemMessage(content=_QA_SYSTEM),
         HumanMessage(content=(
             "Read tsconfig.json and package.json (use read_file). "
             "Then concisely (under 200 words):\n"
             "1. Exact moduleResolution setting and whether .js extensions are needed\n"
             "2. Test runner available?\n"
             "3. Risks/edge cases for this change\n\n"
             f"Plan:\n{state.session_plan}"
         ))],
    )
    print(f"\n  🧪 QA Agent:\n{_indent(result)}\n")
    return {"orient_reports": [f"## QA Agent\n{result}"]}


def pm_refine(state: AgentState) -> dict:
    """PM synthesizes orient reports into a single implementation brief."""
    print("▶ pm_refine")
    orient_context = "\n\n".join(state.orient_reports)
    resp = get_llm().invoke([
        SystemMessage(content=_PM_SYSTEM),
        HumanMessage(content=(
            "The architects and QA have reviewed the codebase. Synthesize their "
            "recommendations into a single implementation brief for the developer.\n\n"
            "The brief must include:\n"
            "- Exactly which files to read and modify\n"
            "- The exact changes to make (quote specific lines where possible)\n"
            "- Any conflicts between architect recommendations and your resolution\n"
            "- What NOT to change\n\n"
            "Keep it concise and actionable — this is the developer's only input.\n\n"
            f"## Original request\n{state.user_request}\n\n"
            f"## Session plan\n{state.session_plan}\n\n"
            f"## Architect & QA reports\n{orient_context}"
        )),
    ])
    print(f"\n{'─' * 60}\n📝 IMPLEMENTATION BRIEF:\n{'─' * 60}")
    print(resp.content)
    print(f"{'─' * 60}\n")
    return {"implementation_brief": resp.content}


def implement(state: AgentState) -> dict:
    print("▶ implement")
    llm = get_llm(max_tokens=4096).bind_tools(_TOOLS_ALL)
    result = _run_with_tools(llm, [
        SystemMessage(content=_DEV_SYSTEM),
        HumanMessage(content=(
            f"## Implementation brief\n{state.implementation_brief}\n\n"
            "Read the files mentioned, make the changes with patch_file, "
            "and summarize what you did."
        )),
    ], max_rounds=20, verbose=True)

    print(f"\n  🔨 Developer:\n{_indent(result)}\n")
    return {"implementation_report": result}


def validate(state: AgentState) -> dict:
    print("▶ validate")
    errors = ""
    tsc = run_typecheck()
    if tsc:
        errors += f"## TypeScript errors\n{tsc}\n"
    lint = run_lint()
    if lint:
        errors += f"## ESLint errors\n{lint}\n"

    if errors:
        print(f"  ❌ errors (attempt {state.validation_attempts + 1})")
        print(errors[:500])
    else:
        print("  ✅ clean build")

    return {"validation_errors": errors, "validation_attempts": state.validation_attempts + 1}


def fix(state: AgentState) -> dict:
    print(f"▶ fix (attempt {state.validation_attempts})")
    llm = get_llm(max_tokens=4096).bind_tools(_TOOLS_ALL)
    result = _run_with_tools(llm, [
        SystemMessage(content=_FIX_SYSTEM),
        HumanMessage(content=(
            f"## Errors\n{state.validation_errors}\n\n"
            "Read the files with errors, then use patch_file to fix them."
        )),
    ], max_rounds=15, verbose=True)

    print(f"  ✅ {result[:200]}")
    return {"implementation_report": state.implementation_report + f"\n\nFix: {result}"}



def review(state: AgentState) -> dict:
    """PM reviews changed files against the original request."""
    print("▶ review")
    llm = get_llm().bind_tools(_TOOLS_READ)
    result = _run_with_tools(llm, [
        SystemMessage(content=(
            "You are a code reviewer. Read the files that were changed and verify "
            "the original request was FULLY satisfied. Be strict — if the request "
            "asked for two things and only one was done, that's a failure."
        )),
        HumanMessage(content=(
            f"## Original request\n{state.user_request}\n\n"
            f"## Developer report\n{state.implementation_report}\n\n"
            "Read the files mentioned in the report. Check EVERY acceptance criterion "
            "from the request. Respond with:\n"
            "PASS: <one-line summary>\n"
            "or\n"
            "FAIL: <what's missing — be specific about what code needs to change>"
        )),
    ])

    # Parse PASS/FAIL
    clean = result.strip()
    for line in clean.splitlines():
        stripped = line.strip().lstrip("✅❌ *#>-")
        if "PASS" in stripped.upper()[:10]:
            print(f"  ✅ Review: {stripped}")
            return {"review_feedback": "", "review_attempts": state.review_attempts + 1}
        if "FAIL" in stripped.upper()[:10]:
            print(f"  ❌ Review: {stripped}")
            return {"review_feedback": stripped, "review_attempts": state.review_attempts + 1}


def revise(state: AgentState) -> dict:
    """Developer addresses review feedback."""
    print(f"▶ revise (attempt {state.review_attempts})")
    llm = get_llm(max_tokens=4096).bind_tools(_TOOLS_ALL)
    result = _run_with_tools(llm, [
        SystemMessage(content=_DEV_SYSTEM),
        HumanMessage(content=(
            f"## Original request\n{state.user_request}\n\n"
            f"## Review feedback\n{state.review_feedback}\n\n"
            "The reviewer found unmet requirements. Read the relevant files "
            "and use patch_file to address the feedback. Then summarize."
        )),
    ], max_rounds=20, verbose=True)

    print(f"\n  🔨 Revise:\n{_indent(result)}\n")
    return {"implementation_report": result}

    # Ambiguous — treat as pass
    print(f"  ✅ Review: {clean[:100]}")
    return {"review_feedback": "", "review_attempts": state.review_attempts + 1}

def memorialize(state: AgentState) -> dict:
    print("▶ memorialize")
    specs_dir = _MEMORY_DIR / "specs"
    existing = []
    if specs_dir.is_dir():
        for f in sorted(specs_dir.iterdir()):
            if f.suffix == ".md":
                existing.append(f"- {f.name}: {f.read_text().split(chr(10), 1)[0]}")

    resp = get_llm().invoke([
        SystemMessage(content=_PM_SYSTEM),
        HumanMessage(content=(
            "Change implemented and passes build. Decide how to record it.\n\n"
            "Respond with EXACTLY one of these on the FIRST LINE (no markdown, no bold, no extra text):\n"
            "SKIP: <reason>\n"
            "AMEND: <filename.md>\n"
            "NEW: <title>\n\n"
            "Then on subsequent lines, provide the spec content (for AMEND/NEW).\n\n"
            f"Existing specs:\n{''.join(existing) or '(none)'}\n\n"
            f"Request: {state.user_request}\n\n"
            f"Result: {state.implementation_report[:2000]}"
        )),
    ])

    # Parse the decision from the response — search for the keyword anywhere in first few lines
    text = resp.content.strip()
    decision_line = ""
    body_lines: list[str] = []
    for i, line in enumerate(text.splitlines()):
        clean = line.strip().lstrip("✅❌⏭️ *#>-")
        if not decision_line:
            for prefix in ("SKIP:", "AMEND:", "NEW:"):
                if prefix in clean.upper():
                    idx = clean.upper().index(prefix)
                    decision_line = clean[idx:]
                    body_lines = text.splitlines()[i + 1:]
                    break
        if decision_line:
            break

    if not decision_line:
        print(f"  ⚠️  Could not parse decision from response, skipping")
        return {"spec_written": False}

    body = "\n".join(body_lines).strip()

    if decision_line.upper().startswith("SKIP"):
        print(f"  ⏭️  {decision_line}")
        return {"spec_written": False}

    if decision_line.upper().startswith("AMEND:"):
        # Extract filename — look for something ending in .md
        rest = decision_line.split(":", 1)[1].strip()
        filename = None
        for word in rest.replace("*", "").replace("`", "").split():
            if word.endswith(".md"):
                filename = word.strip(",;:")
                break
        if not filename:
            filename = re.sub(r"[^a-z0-9]+", "-", rest.lower()).strip("-") + ".md"
        spec_path = f"agents/memory/specs/{filename}"
        # Strip markdown fences from body if present
        body = re.sub(r"^```\w*\n|```$", "", body, flags=re.MULTILINE).strip()
        write_file.invoke({"path": spec_path, "content": body})
        print(f"  📝 Amended {filename}")
        return {"spec_written": True}

    # NEW
    body = re.sub(r"^```\w*\n|```$", "", body, flags=re.MULTILINE).strip()
    first = body.strip().splitlines()[0] if body.strip() else "untitled"
    slug = re.sub(r"[^a-z0-9]+", "-", first.lower().replace("#", "").strip()).strip("-") or "untitled"
    write_file.invoke({"path": f"agents/memory/specs/{slug}.md", "content": body})
    print(f"  📝 Saved {slug}.md")
    return {"spec_written": True}
