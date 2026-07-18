# Morrow Demo Script

This script is designed for a three-minute classroom, professor, recruiter, or competition demonstration. It keeps the product's strongest interaction loop while stating the current model boundary plainly.

## Before going on stage

1. Run `npm run check`, `npm run test:e2e`, and `npm audit`.
2. Run `npm run build` and serve the current `dist/` release over HTTPS or with `npm run preview`.
3. Open Morrow once while connected so the application shell is cached.
4. Confirm that the landing page, cockpit, Cascade, Optimize, Evidence, and brief all open.
5. Prepare two tabs. Keep one at the landing page and one at the cockpit.
6. If public-event connectors fail, use the visibly labeled synthetic demo events. Do not imply that they are current.

## Three-minute presentation

### 0:00–0:25 — Frame the problem

Show the landing page.

> “Crisis dashboards are good at showing what and where. Morrow is a local-first rehearsal lab for a different classroom question: given a fictional compound shock and a limited response budget, which assumptions and trade-offs shape the discussion?”

Point to **Works offline**, **Reproducible**, and **No account**.

> “This is an illustrative teaching model, not a warning system or operational forecast.”

Click **Run the 72-hour rehearsal**.

### 0:25–0:55 — Orient, then intervene

Show the selected fictional archetype and the map.

> “The map provides geographic orientation. NASA and USGS events are optional context pins only; they never alter the model.”

Move two or three intervention sliders. For a like-for-like comparison with full-budget candidates, either commit the full budget ceiling before searching or state clearly that candidate generation uses the full ceiling.

> “Every action has a cap, a deployment delay, diminishing returns, and an illustrative effect assumption.”

### 0:55–1:25 — Inspect the cascade

Open **Cascade**, replay the timeline, and select one downstream node.

> “The value is not a measured forecast. It is modeled pressure from a small equation whose persistence, incoming weights, and delays are visible. The exercise is designed so participants can challenge those assumptions.”

Show the assumption-status box.

### 1:25–1:50 — Apply the disclosed stress case

Increase the stress control and show the changed outcome.

> “The stress control applies one disclosed shared degradation to access, infrastructure, power and communications, route-dependent delivery, markets, and the seeded variation spread. It is an exercise assumption—not discovery of a real failure or an exhaustive worst case.”

### 1:50–2:25 — Compare candidate portfolios

Open **Optimize** and run the search.

> “Morrow evaluates 160 reproducible, budget-valid candidates and retains one for each of four declared weighted objectives. This is a bounded candidate search, not proof of a global optimum.”

Inspect two candidates and highlight the different budget allocations and outcome shapes.

> “The tool keeps the value judgment visible; it does not select a plan autonomously.”

### 2:25–2:50 — Produce the artifact

Open the decision brief.

> “The session ends with a reproducible artifact: scenario and model versions, outcome differences, allocations, limitations, source references, and a fingerprint.”

Show Print/PDF and JSON.

### 2:50–3:00 — Close

> “Morrow does not predict the next disaster. It makes a crisis exercise inspectable, repeatable, and easier to debate—on one device, even when the room loses connectivity.”

## Questions to answer precisely

**Is it calibrated to a real city?**

No. The shipped archetypes, population, exposure, and coefficients are illustrative. The calibration path is documented in `METHODOLOGY.md`.

**Do live events change the simulation?**

No. They are display-only context. Simulation inputs come from the selected built-in or validated shared scenario.

**Does the optimizer find the mathematically best plan?**

No. It searches a bounded seeded set and keeps the highest-scoring candidate for four declared weighted objectives.

**Does the stress button find a worst case?**

No. The current release applies one disclosed correlated access/power/communications exercise setting. It does not enumerate every failure or prove a worst case.

**Can it be used during an emergency?**

Not for alerts, forecasts, eligibility, denial of resources, or autonomous operational decisions. It is for facilitated education and tabletop rehearsal.

## Backup plan

- Keep a screen recording of the three-minute flow.
- Keep one printed decision brief.
- Keep a production-build copy on the presentation machine.
- If networking fails before first load, serve `dist/` locally; do not open `index.html` directly from the filesystem.
