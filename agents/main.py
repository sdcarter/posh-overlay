"""
PoshDash LangGraph agent runner.

Run with:
    uv run agents                      # interactive prompt
    uv run agents --file request.md    # read from file
or:
    uv run python -m agents.main
"""

import argparse
from pathlib import Path

from agents.graph import build_graph
from agents.state import AgentState


def _read_input(file_path: str | None) -> str:
    if file_path:
        return Path(file_path).read_text().strip()
    print("What would you like to work on this session?")
    print("(Paste or type your input, then press Enter twice to submit)\n")
    lines: list[str] = []
    while True:
        line = input("> " if not lines else "  ")
        if line == "" and lines:
            break
        lines.append(line)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="PoshDash agent workflow")
    parser.add_argument("--file", "-f", help="Read session request from a file")
    args = parser.parse_args()

    user_input = _read_input(args.file)
    print(f"\n📋 Request:\n{user_input}\n")
    print("🐙 Starting agent workflow...\n")

    result = build_graph().invoke(AgentState(user_request=user_input))

    print("\n" + "=" * 60)
    print("SESSION COMPLETE")
    print("=" * 60)
    if result["validation_errors"]:
        print(f"\n⚠️  Unresolved errors after {result['validation_attempts']} attempts:")
        print(result["validation_errors"])
    else:
        print(f"\n✅ Clean build after {result['validation_attempts']} validation pass(es)")


if __name__ == "__main__":
    main()
