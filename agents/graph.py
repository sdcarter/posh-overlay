"""Build the LangGraph state graph."""

from langgraph.graph import StateGraph, START, END

from agents.nodes import (
    frontend_orient,
    fix,
    implement,
    memorialize,
    pm_onboard,
    pm_plan,
    pm_refine,
    qa_orient,
    review,
    revise,
    sdk_orient,
    validate,
)
from agents.state import AgentState

MAX_FIX_ATTEMPTS = 3
MAX_REVIEW_ATTEMPTS = 2


def _after_validate(state: AgentState) -> str:
    if state.validation_errors and state.validation_attempts < MAX_FIX_ATTEMPTS:
        return "fix"
    if state.validation_errors:
        return "done"
    return "review"


def _after_review(state: AgentState) -> str:
    if state.review_feedback and state.review_attempts < MAX_REVIEW_ATTEMPTS:
        return "revise"
    if state.review_feedback:
        return "done"
    return "memorialize"


def build_graph():
    g = StateGraph(AgentState)

    g.add_node("pm_onboard", pm_onboard)
    g.add_node("pm_plan", pm_plan)
    g.add_node("sdk_orient", sdk_orient)
    g.add_node("frontend_orient", frontend_orient)
    g.add_node("qa_orient", qa_orient)
    g.add_node("pm_refine", pm_refine)
    g.add_node("implement", implement)
    g.add_node("validate", validate)
    g.add_node("fix", fix)
    g.add_node("review", review)
    g.add_node("revise", revise)
    g.add_node("memorialize", memorialize)

    # PM flow
    g.add_edge(START, "pm_onboard")
    g.add_edge("pm_onboard", "pm_plan")

    # Parallel orient
    g.add_edge("pm_plan", "sdk_orient")
    g.add_edge("pm_plan", "frontend_orient")
    g.add_edge("pm_plan", "qa_orient")

    # Fan-in → PM refines → implement
    g.add_edge("sdk_orient", "pm_refine")
    g.add_edge("frontend_orient", "pm_refine")
    g.add_edge("qa_orient", "pm_refine")
    g.add_edge("pm_refine", "implement")

    # Validate loop
    g.add_edge("implement", "validate")
    g.add_conditional_edges("validate", _after_validate, {"fix": "fix", "review": "review", "done": END})
    g.add_edge("fix", "validate")

    # Review loop
    g.add_conditional_edges("review", _after_review, {"revise": "revise", "memorialize": "memorialize", "done": END})
    g.add_edge("revise", "validate")

    # Done
    g.add_edge("memorialize", END)

    return g.compile()
