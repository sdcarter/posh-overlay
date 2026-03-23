# Analysis: Spec and Plan Constitutional Review

## Verdict
GO with minor plan refinement applied.

The capsule redesign spec and 6-task plan are architecturally sound and align with the constitution after the Task 5 refinement.

## Constitution Compliance Matrix

### 1) Hexagonal Architecture
Status: PASS

Reasoning:
- UI redesign is scoped to renderer presentation work.
- Telemetry extension is limited to domain type and adapter population.
- No business logic migration into renderer is required.

Relevant docs:
- .specify/memory/constitution.md
- .specify/specs/capsule-overlay-redesign/spec.md
- .specify/specs/capsule-overlay-redesign/plan.md

### 2) Clean Separation of Concerns
Status: PASS with guardrail

Reasoning:
- Plan keeps rev logic in existing computed state and reuses it in rendering.
- Task 5 now explicitly states renderer remains presentational and mock adapter is updated for parity.

Guardrail:
- Do not derive race position from unrelated renderer values; only read `positionOverall` from snapshot.

### 3) Type Safety
Status: PASS (pending implementation discipline)

Reasoning:
- `positionOverall` can be introduced as nullable numeric field in snapshot.
- Updating both iRacing and mock adapters avoids partial type rollouts.

Guardrail:
- Keep fallback formatting in renderer (`--`) and avoid broad union inflation.

### 4) Transparent Overlay Integrity
Status: PASS

Reasoning:
- No task proposes mutating BrowserWindow creation flags.
- Drag/resize/lock behavior is explicitly preserved and re-verified in Task 6.

### 5) Minimal Dependencies
Status: PASS

Reasoning:
- No new library is required for this redesign.
- Styling remains inline/tokenized in React components.

### 6) Coding Standards
Status: PASS

Reasoning:
- Plan includes lint/build validation.
- Renderer-only style approach matches project convention.

## Architectural Decisions Confirmed
1. Build capsule UI in renderer without altering domain rev evaluation rules.
2. Use existing laps telemetry (`sessionLapsRemain`) with null-safe fallback.
3. Add only one new telemetry field now: `positionOverall`.
4. Keep lower ribbon allocation to current data set (incidents, BB, TC, ABS).

## Risks and Mitigations
1. Position telemetry source may vary by iRacing session context.
Mitigation: Use defensive adapter mapping and nullable field.

2. Compact layout readability at extreme sizes.
Mitigation: Enforce minimum scaling and preserve hierarchy in typography.

3. Flash animation performance.
Mitigation: Preserve current lightweight flashing semantics and avoid layout-heavy animation.

## Recommendation
Proceed to implementation in the planned order, starting with renderer capsule layout and rev-dot integration, then add `positionOverall` telemetry wiring.
