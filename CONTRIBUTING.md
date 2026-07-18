# Contributing to Morrow

Morrow accepts contributions that improve the reliability, inspectability, accessibility, and teaching value of the crisis rehearsal workflow. The current model is illustrative; contributions must preserve that boundary.

## Set up

```bash
npm ci
npm run dev
```

Use Node.js 20.19 or newer. Do not commit `node_modules/`, `dist/`, coverage output, browser traces, editor state, secrets, or local environment files.

## Before opening a change

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:e2e
npm audit
```

## Non-negotiable invariants

- matching scenario, seed, model version, and dataset version produce matching results and fingerprint;
- all numeric outputs are finite and bounded where documented;
- assumption-variation percentiles remain ordered;
- allocations remain non-negative, within intervention caps, and within the budget ceiling;
- imported, shared, and persisted state passes strict runtime validation;
- the core rehearsal remains usable without public connectors after the application is cached;
- public-event context never changes the simulation automatically;
- no personal data, vulnerable-person locations, analytics collector, or secret is added;
- every critical interaction remains keyboard operable and supports reduced motion;
- the product never presents the illustrative release as a real-event forecast, calibrated jurisdiction model, or autonomous allocator.

## Claim discipline

Interface and documentation claims are part of the tested product surface.

- Describe the portfolio feature as a bounded seeded search with declared weighted objectives.
- Describe the stress control as one disclosed correlated access/power/communications exercise case, not exhaustive failure discovery.
- Describe the world map as orientation plus a local illustrative halo and context pins.
- Describe NASA and USGS events as display-only context.
- Describe numeric intervention effects, population, exposure, and archetype values as illustrative unless a reviewed calibrated release documents otherwise.
- Do not infer causality or additive benefit shares from normalized leave-one-out sensitivity.
- Do not use “recommended” for an automatically selected portfolio.

## Model changes

Any change to a coefficient, equation, hazard curve, metric, search score, preset, or assumption-variation distribution requires:

1. a model-version decision;
2. updated tests and a regression fixture;
3. an updated `METHODOLOGY.md` and `MODEL_CARD.md`;
4. an entry in `CHANGELOG.md`;
5. review of shared-scenario compatibility;
6. a clear classification as official observation, published contextual evidence, expert elicitation, or illustrative assumption.

Broad reports may motivate an intervention category but do not validate an exact coefficient. Cite the estimate actually used or keep the coefficient in the illustrative assumption set.

## Product changes

Keep the primary workflow short:

```text
choose fictional scenario
→ allocate budget
→ inspect assumptions
→ apply disclosed stress
→ compare candidates
→ export discussion artifact
```

New features need evidence from repeated facilitator or learner behavior. Avoid adding accounts, collaboration infrastructure, operational alerts, or private data before the validated use case requires them.

## Pull-request checklist

- [ ] Scope and user problem are stated.
- [ ] Tests fail without the change and pass with it where practical.
- [ ] Model and safety wording still matches implementation.
- [ ] New data has provenance, terms, version, and failure behavior.
- [ ] Keyboard, screen reader, reduced-motion, zoom, mobile, print, and offline paths were considered.
- [ ] No unrelated generated files or user changes are included.
- [ ] Documentation and changelog are updated.
- [ ] Screenshots or recordings contain no personal or confidential information.

## Security reports

Do not open a public issue containing exploit details, private information, or sensitive operational plans. Use the repository's private security-reporting channel when available; otherwise contact the project owner directly with a minimal reproduction and proposed disclosure window.
