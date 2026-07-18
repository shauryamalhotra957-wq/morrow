# Model Card: Morrow Cascade 1.0

## Summary

Morrow Cascade 1.0 is a deterministic system-dynamics approximation for rehearsing fictional compound-crisis response choices. It generates bounded pressure trajectories, explicitly labeled proxy comparisons, seeded assumption-variation bands, leave-one-out intervention sensitivity, and four objective-weighted budget candidates. The same engine runs in the browser and optional API.

It is not machine learning and does not make individualized predictions.

## Version

- Model: `morrow-cascade-1.0.0`
- Assumption pack: `morrow-assumption-pack-1.0.0`
- Schema: `1`

## Intended users

- university instructors and students;
- tabletop-exercise facilitators;
- humanitarian and civic-technology practitioners serving as reviewers or co-designers in facilitated, non-operational exercises;
- researchers reviewing transparent decision interfaces.

## Intended uses

- teaching systems pathways and trade-offs;
- comparing illustrative response portfolios;
- challenging assumptions in a facilitated exercise;
- producing a reproducible discussion artifact;
- usability and decision-intelligence research.

## Prohibited or unsupported uses

- authoritative emergency alerts or evacuation instructions;
- operational emergency forecasting;
- automatic allocation or denial of resources;
- decisions about an individual, household, or protected group;
- replacement for competent public authorities or local experts;
- claims that attribution proves causality;
- hiding, removing, or weakening proxy, assumption-variation, and limitation labels.

## Inputs

Crisis archetype, hazard intensity, fragility, correlated access/power/communications stress, illustrative budget, eight intervention allocations, and seed.

## Outputs

Thirteen six-hour trajectory points; seven domain-pressure proxies; a system-pressure proxy; p10/p50/p90 assumption-variation bands; protection, loss, unmet-need, mobilization, inclusion-intent, pressure-stability, and stability-composite proxies; intervention sensitivity; four objective winners; and a fingerprint. None is an observed outcome, calibrated probability, fairness measure, or forecast.

## Evaluation

The current release is evaluated for software invariants and interaction safety, not predictive accuracy. Automated tests cover determinism, numeric bounds, ordered percentiles, budget constraints, schema rejection, persistence recovery, core interaction, and accessibility smoke checks.

## Known limitations

- Coefficients are illustrative and not locally calibrated.
- Archetypes omit politics, conflict, behavior, supply substitution, informal networks, and many feedback loops.
- Seeded variations sample selected assumption magnitudes, not every plausible model structure.
- Outcome units may look concrete even though they are scenario quantities; the UI repeatedly labels them illustrative.
- Geographic visualization can imply more spatial precision than the model contains.
- Intervention sensitivity uses leave-one-out marginal comparison and only approximates interaction effects.
- Optimizer candidates are a seeded search, not a proof of global optimality.
- The stress control imposes one disclosed shared degradation across access, infrastructure, power/communications-dependent delivery, markets, and variation spread. It does not discover a real failure or enumerate every implementation breakdown.
- The stability composite is not a probability of success, fairness measure, or worst-case guarantee.

## Harm risks and controls

| Risk | Control |
|---|---|
| False precision | Persistent unvalidated-output labels, proxy definitions, visible assumptions, seeded-variation bands, and rounded presentation. |
| Automation bias | Four explicit objective-weighted candidates; no single “recommended” plan; human judgment language. |
| Operational misuse | Persistent “not an operational forecast” language and no autonomous alerts. |
| Discriminatory allocation | Inclusion-intent proxy is explicitly not fairness; no individual/group data or eligibility decisions. |
| Privacy leakage | Local-first design, no telemetry, no personal or precise vulnerable-person locations. |
| Model opacity | Inspectable equations, edges, delays, source ledger, and version fingerprint. |
| Brittle plan | One disclosed correlated access/power stress case plus seeded assumption variation; no claim of exhaustive red-teaming. |

## Human oversight

Every session should have a facilitator who explains that the model is illustrative, asks participants to challenge assumptions, and defers to competent authorities for real events. A decision brief should record the discussion, not certify a plan.

## Change policy

Any coefficient, equation, metric, preset, or optimizer-weight change requires:

1. a model-version change;
2. updated methodology;
3. invariant and regression tests;
4. a changelog entry;
5. review of prior shared-scenario compatibility.
