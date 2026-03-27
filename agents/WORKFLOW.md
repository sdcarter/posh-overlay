# Agent Workflow

```mermaid
---
config:
  flowchart:
    curve: linear
---
graph TD;
	__start__([<p>__start__</p>]):::first
	pm_onboard(pm_onboard)
	pm_plan(pm_plan)
	sdk_orient(sdk_orient)
	frontend_orient(frontend_orient)
	qa_orient(qa_orient)
	implement(implement)
	validate(validate)
	fix(fix)
	review(review)
	revise(revise)
	memorialize(memorialize)
	__end__([<p>__end__</p>]):::last
	__start__ --> pm_onboard;
	fix --> validate;
	frontend_orient --> implement;
	implement --> validate;
	pm_onboard --> pm_plan;
	pm_plan --> frontend_orient;
	pm_plan --> qa_orient;
	pm_plan --> sdk_orient;
	qa_orient --> implement;
	review -.-> memorialize;
	review -.-> revise;
	revise --> validate;
	sdk_orient --> implement;
	validate -. &nbsp;done&nbsp; .-> __end__;
	validate -.-> fix;
	validate -.-> review;
	memorialize --> __end__;
	classDef default fill:#f2f0ff,line-height:1.2
	classDef first fill-opacity:0
	classDef last fill:#bfb6fc

```

## Node Descriptions

| Node | Role | What it does |
|------|------|-------------|
| pm_onboard | Product Manager | Summarizes the request |
| pm_plan | Product Manager | Creates session plan with acceptance criteria |
| sdk_orient | SDK Architect | Reads domain/application code, recommends types and files |
| frontend_orient | Frontend Architect | Reads renderer code, identifies exact lines to change |
| qa_orient | QA Agent | Checks build config, flags risks |
| implement | Developer (gpt-5-chat) | Reads files, makes surgical edits via patch_file |
| validate | Build check | Runs tsc + eslint locally (no LLM) |
| fix | Developer (gpt-5-chat) | Reads errors, patches files to fix build |
| review | PO Acceptance | Reads changed files, verifies request was fully met |
| revise | Developer (gpt-5-chat) | Addresses review feedback |
| memorialize | Product Manager | Saves or amends feature spec in memory |
