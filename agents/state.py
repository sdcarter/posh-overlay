"""Shared state schema for the agent graph."""

from __future__ import annotations

import operator
from dataclasses import dataclass, field
from typing import Annotated


@dataclass
class AgentState:
    """Accumulates context as it flows through the graph."""

    user_request: str = ""
    session_plan: str = ""
    orient_reports: Annotated[list[str], operator.add] = field(default_factory=list)
    implementation_report: str = ""

    # Validation loop
    validation_errors: str = ""
    validation_attempts: int = 0

    # Review loop
    review_feedback: str = ""
    review_attempts: int = 0

    # Post-implementation memory
    spec_written: bool = False
