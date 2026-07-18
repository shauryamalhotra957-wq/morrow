# Methodology

## Purpose

Morrow is an illustrative systems model for education, tabletop exercises, and early program comparison. It combines visible assumptions, seeded assumption variations, intervention constraints, and explicit trade-offs. It is not calibrated for operational emergency forecasting.

The implementation in `src/domain/simulator.ts` is the authoritative specification. The current numeric assumptions belong to **Assumption Pack 1.0**.

## Scenario definition

A scenario fixes:

- a fictional crisis archetype and geographic label;
- population-at-risk and economic-exposure assumptions;
- hazard intensity and fragility;
- a shared access and power/communications stress setting;
- a total illustrative response budget;
- eight intervention allocations;
- model and dataset versions;
- a deterministic random seed.

The three shipped archetypes use different hazard curves and domain biases:

- Coastal cyclone: approach, landfall peak, and decaying tail.
- Heat–water–grid shock: slower arrival and sustained plateau.
- Urban earthquake: sharp primary shock and smaller aftershock.

These are teaching archetypes, not named real-event predictions.

## State vector

At each six-hour step, the model tracks normalized pressure from 0 to 100 for:

1. communications gap;
2. infrastructure failure;
3. displacement pressure;
4. water insecurity;
5. food insecurity;
6. health-system load;
7. market disruption.

Hazard is exogenous. Every other node combines persistence, delayed upstream pressure, scenario fragility, intervention protection, and the selected shared stress setting.

## Intervention response

For allocation `a` and intervention maximum `m`, saturation is:

```text
saturation(a) = (1 − exp(−3a/m)) / (1 − exp(−3))
```

This creates diminishing returns while reaching 1 at the documented maximum. Readiness is zero before the declared deployment delay and then follows a smooth-step curve over 18 hours:

```text
smoothstep(x) = x²(3 − 2x), clamped to [0, 1]
```

A declared delay of zero is the explicit exception: the teaching model treats that intervention as immediately ready at full modeled strength. For every nonzero delay, strength is exactly zero at the onset hour and reaches full readiness 18 hours later. UI and export labels distinguish onset from full readiness.

Node protection combines interventions multiplicatively so two actions cannot create unbounded protection:

```text
combined = 1 − Π(1 − effect × strength)
```

Protection is capped. Three explicitly documented interaction terms exist:

- early warning × assisted evacuation;
- mobile clinics × microgrids and clean water;
- route recovery × staged supplies.

## Illustrative pathway update

Every modeled node follows the same conceptual form:

```text
pressure(node,t) = clamp(
  [persistence × pressure(node,t−1)
   + direct hazard term (communications and infrastructure only)
   + Σ(upstream pressure × pathway weight × variation factor)]
  × [1 − protection(node,t) × protection efficiency],
  0,
  100
)
```

Exact weights, persistence values, equations, and delays are visible in the code and Assumption Atlas. They are illustrative, versioned, and challengeable; the pathways do not establish real-world cause and effect.

## Shared stress-control semantics

The baseline setting is 15. Values above 15 create one normalized shared stress value:

```text
s = clamp((stress − 15) / 65, 0, 1)
```

That same `s` is used throughout a run:

```text
route-pressure multiplier        = 1 + 0.34s
power/communications multiplier = 1 + 0.29s
market-pressure multiplier       = 1 + 0.20s
pathway-strength multiplier      = 1 + 0.18s
```

The setting also reduces the realized protection of infrastructure, communications, food, health, and water interventions by declared amounts. This represents one correlated exercise assumption: route access and power/communications-dependent delivery deteriorate together. It is applied consistently to the selected plan and its no-action comparator.

The control does not discover a real failure, enumerate every implementation breakdown, or establish a worst case. The stability composite also includes the declared stress setting directly, so it must not be interpreted as a probability of success.

## System-pressure proxy

The chart’s system-pressure proxy is a fixed weighted combination:

| Domain | Weight |
|---|---:|
| Communications | 0.08 |
| Infrastructure | 0.19 |
| Displacement | 0.15 |
| Water | 0.14 |
| Food | 0.13 |
| Health | 0.20 |
| Markets | 0.11 |

The interface does not present this as a universal welfare score. Domain pressures remain available separately.

## Seeded assumption variations

Morrow runs **48 seeded variations** by default. A `mulberry32` generator varies:

- hazard magnitude;
- fragility;
- overall pathway strength.

One shared draw introduces correlated movement across those three factors, while additional draws keep the variation set from collapsing to one dimension. Each variation runs both the selected portfolio and a matching no-action baseline. The chart reports descriptive p10, p50, and p90 system-pressure values at every time step.

These percentile bands summarize only the 48 declared variations. They are not forecast intervals, calibrated probabilities, or a representation of every omitted event, structural choice, implementation failure, political response, behavior, or measurement issue.

## Model proxies

- **Affected-people proxy:** population-at-risk assumption multiplied by a rule-based conversion from mean and peak system pressure.
- **Protection proxy:** difference between the no-action and selected-portfolio affected-people proxies; never below zero.
- **Scenario-loss proxy:** economic-exposure assumption scaled by infrastructure and market pressure.
- **Loss-proxy delta:** difference between the no-action and selected-portfolio scenario-loss proxies; never below zero.
- **Unmet-need proxy:** affected-people proxy scaled by health, water, and food pressure.
- **Mobilization hours:** rule-based timing proxy influenced by warning, staged supplies, and route recovery.
- **Inclusion proxy:** spending-mix proxy influenced by cash, water, warning, evacuation, and allocation concentration. It does not measure benefit distribution across population groups.
- **Pressure stability:** inverse composite of mean and peak system pressure.
- **Stability composite:** pressure stability, inclusion intent, declared stress, and the spread of modeled benefit across the seeded variation set.

All population, economic, timing, inclusion, and stability outputs are illustrative model quantities—not observations, forecasts, benefit-cost estimates, or promises.

## Leave-one-out sensitivity

For each funded intervention, the engine reruns the plan with that allocation removed. The increases in the affected-people proxy and scenario-loss proxy create a combined sensitivity value. Values are normalized to 100%.

This is a leave-one-out sensitivity share. It approximates interaction effects and does not prove that an intervention produced a real-world effect.

## Seeded objective search

The search generates 160 budget-valid portfolios from a seeded distribution, respects every intervention maximum, and corrects rounding so the budget is exact. It retains the highest-scoring candidate—the **objective winner**—for each declared score:

- balanced objective;
- early-action objective;
- vulnerability-intent objective;
- stability-proxy objective.

The search is bounded and reproducible. It does not prove global optimality or compute a nondominated set. Candidate selection uses direct, nominal model metrics. Each objective winner then receives the full 48-variation sensitivity run before display (a shared allocation winner is simulated once and reused). The visible score is recalculated from those displayed, stability-adjusted metrics; it can therefore differ from the internal nominal screening score. The release does not optimize a forecast percentile, minimax regret, or a discovered worst case.

Browser and API searches execute cooperatively in small batches. Yielding does not change candidate order, draws, winners, metrics, or fingerprints; it prevents the bounded CPU work from monopolizing the browser main thread or API event loop and gives cancellation a deterministic boundary.

## Reproducibility

The scenario fingerprint hashes:

- model and dataset versions;
- preset, seed, budget, hazard, fragility, and stress;
- sorted allocations;
- final model proxies.

`generatedAt` is intentionally excluded. Matching inputs produce matching trajectories, variation bands, model proxies, objective winners, and fingerprint.

## Verification targets

The automated suite is designed to check:

- deterministic results for the same scenario and seed;
- finite, bounded time-series values;
- ordered `p10 ≤ p50 ≤ p90` bands;
- zero protection and loss deltas for a no-action portfolio;
- non-negative, capped, budget-valid allocations;
- no more than four full variation simulations per optimizer search;
- identical synchronous and cooperative results;
- strict rejection of malformed imported or shared state.

Run `npm run check` for the repository’s current lint, type, test, and build result. No fixed test count or coverage percentage is asserted here.

## Calibration path

Operational credibility would require a separate reviewed release:

1. define a narrow jurisdiction and use case;
2. replace archetype baselines with versioned observed data;
3. estimate or elicit every pathway with documented admissible ranges;
4. validate retrospectively on held-out events;
5. test sensitivity to model structure, not only coefficient values;
6. include local experts and affected communities;
7. publish error, calibration, subgroup, and failure reports;
8. retain human authority and competent-agency warning channels.

Until that work is complete, the current model must remain labeled illustrative.
