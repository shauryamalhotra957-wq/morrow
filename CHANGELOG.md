# Changelog

All notable product, model, data, safety, and compatibility changes are recorded here. Morrow follows semantic versioning for the application; model and dataset versions are recorded separately when they change.

## [1.0.0] — 2026-07-17

### Added

- Three fictional crisis archetypes: coastal cyclone, heat–water–grid shock, and urban earthquake.
- Browser-side 72-hour illustrative systems simulation with explicit intervention delays, saturation, and synergies.
- Forty-eight seeded parameter-variation runs with p10, p50, and p90 system-risk bands.
- Eight budget-constrained interventions.
- Bounded 160-candidate portfolio search across four declared weighted objectives.
- One disclosed correlated access/power/communications exercise stress control.
- Inspectable cascade graph, leave-one-out sensitivity shares, scenario comparison, local save/share, JSON/CSV export, and print brief.
- Optional NASA EONET and USGS display-context connectors with a synthetic demo snapshot fallback.
- Installable static web application with service-worker caching, strict shared-state validation, security headers, accessibility support, and automated tests.

### Fixed and hardened

- Bumped the offline shell to `morrow-v2`, made installation/activation control handoff atomic, and verified production offline reloads.
- Made saved scenarios immutable local versions with unique identifiers, timestamped command labels, confirmed deletion, and bounded storage-error feedback.
- Replaced the blocking all-candidate sensitivity search with a disclosed two-stage search: 160 direct-model screens, at most four full 48-variation winner runs, visible-score recomputation, cooperative yielding, and cancellation boundaries.
- Reparse and validate shared scenario fragments on same-tab hash/back/forward navigation while preserving the current scenario after an invalid share.
- Preserved explicit rate-limit responses as `RATE_LIMITED` with 429/ban status and `Retry-After`, and added configurable one- or two-hop proxy trust instead of trusting arbitrary forwarded headers.
- Clarified nominal stress as 15–80%, intervention onset versus full readiness, loss-proxy delta semantics, and persistent fictional/unvalidated route disclosures.
- Removed the inline-font CSP conflict, restored modal scrolling, route focus, mobile scenario switching, readable contrast/type density, and 44-pixel interaction targets.

### Documentation

- Added architecture, methodology, model card, data-source registry, security model, accessibility contract, deployment and rollback guide, demo script, contribution policy, business blueprint, and MIT license.
- Standardized the public category as a local-first crisis rehearsal lab for facilitated teaching and tabletop exercises.
- Clarified that public-event context never calibrates or changes simulation output.
- Clarified that the map is an orientation view rather than a spatial forecast.
- Clarified that portfolio results come from a bounded weighted candidate search, not proof of a global optimum.
- Clarified that the stress control is a single sensitivity setting, not a discovered multi-system failure or an exhaustive worst-case search.

### Known limitations

- Archetype baselines and coefficients are illustrative and are not calibrated for operational use.
- Concrete population and economic outputs are scenario quantities, not forecasts or benefit-cost estimates.
- The stability composite is not a success probability, worst-case guarantee, or calibrated measure.
- The inclusion-intent proxy is not a fairness measure and does not model subgroup outcomes.
- The current release must not be used for alerts, evacuation instructions, individual eligibility, resource denial, or autonomous operational decisions.
