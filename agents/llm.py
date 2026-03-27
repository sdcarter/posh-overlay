"""Azure OpenAI LLM factory."""

from __future__ import annotations

import json
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI

load_dotenv()

_CFG_PATH = Path(__file__).resolve().parent / "config.json"
_cfg = json.loads(_CFG_PATH.read_text())


def get_llm(max_tokens: int = 4096) -> AzureChatOpenAI:
    """Chat-capable LLM for conversational agents."""
    api_key = os.environ.get(_cfg["llm"]["api_key_env"], "")
    if not api_key:
        raise EnvironmentError(f"Missing env var: {_cfg['llm']['api_key_env']}")
    return AzureChatOpenAI(
        azure_deployment=_cfg["llm"]["model"],
        azure_endpoint=_cfg["llm"]["azure_endpoint"],
        api_version=_cfg["llm"]["api_version"],
        api_key=api_key,
        max_tokens=max_tokens,
        streaming=False,
    )


def call_codex(prompt: str) -> str:
    """Call gpt-5.3-codex via the Azure responses API."""
    codex = _cfg["codex"]
    api_key = os.environ.get(codex["api_key_env"], "")
    if not api_key:
        raise EnvironmentError(f"Missing env var: {codex['api_key_env']}")
    url = f"{codex['azure_endpoint'].rstrip('/')}/openai/responses?api-version={codex['api_version']}"
    resp = requests.post(
        url,
        headers={"api-key": api_key, "Content-Type": "application/json"},
        json={"model": codex["model"], "input": prompt},
        timeout=300,
    )
    resp.raise_for_status()
    data = resp.json()
    parts: list[str] = []
    for item in data.get("output", []):
        if item.get("type") == "message":
            for c in item.get("content", []):
                if text := c.get("text"):
                    parts.append(text)
    return "\n".join(parts) if parts else str(data)
