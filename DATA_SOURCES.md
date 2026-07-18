# Data Sources and Provenance

## Provenance classes

Morrow labels information as one of:

- **Official data:** machine-readable observation from a competent public source.
- **Official report:** published evidence motivating the product or intervention category.
- **Illustrative assumption:** a transparent coefficient, baseline, or scenario value created for the teaching model.

No official organization endorses Morrow.

## Optional public-event context connectors

| Source | Use | Runtime behavior |
|---|---|---|
| [NASA EONET v3](https://eonet.gsfc.nasa.gov/docs/v3) | Open natural-event title, category, time, and point geometry | Optional; response is bounded and validated; failure falls back safely. |
| [USGS Earthquake GeoJSON](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) | Magnitude 4.5+ daily earthquake context | Optional; only official USGS links are retained. |

Fetched events are visual context only. They do not calibrate, initialize, or alter the systems model and must not be interpreted as Morrow alerts.

## Evidence registry

| Organization | Resource | Product relevance |
|---|---|---|
| UNDRR | [Global Assessment Report on Disaster Risk Reduction 2025](https://www.undrr.org/gar/gar2025) | Systemic and cascading disaster cost. |
| WMO | [Global Status of Multi-Hazard Early Warning Systems 2025](https://wmo.int/resources/publication-series/global-status-of-multi-hazard-early-warning-systems/global-status-of-multi-hazard-early-warning-systems-2025) | Early-warning coverage and impact. |
| WFP | [Anticipatory Action — Year in Focus 2025](https://www.wfp.org/publications/anticipatory-action-year-focus-2025) | Acting before a hazard becomes humanitarian impact. |
| WHO | [Global Action Plan on Climate Change and Health 2025–2028](https://apps.who.int/gb/ebwha/pdf_files/WHA78/A78_4Add2-en.pdf) | Resilient health systems and protection of vulnerable groups. |
| IEA | [World Energy Outlook 2025](https://www.iea.org/reports/world-energy-outlook-2025) | Weather, operational, and security risk to electricity systems. |
| UNSD | [Sustainable Development Goals Report 2026](https://unstats.un.org/sdgs/report/2026/The-Sustainable-Development-Goals-Report-2026.pdf) | Current global progress and trusted-statistics context. |

## Future calibration connectors

These sources are documented but not called by the current product:

- [UNSD SDG API](https://unstats.un.org/sdgs/UNSDGAPIV5/swagger/index.html)
- [World Bank Indicators API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392)
- [WHO Global Health Observatory OData API](https://www.who.int/data/gho/info/gho-odata-api)
- [INFORM Risk data](https://drmkc.jrc.ec.europa.eu/inform-index/INFORM-Risk/Results-and-data/moduleId/1782/id/453/controller/Admin/a)
- [HDX Humanitarian API](https://hdx-hapi.readthedocs.io/en/latest/)

Adding a connector requires source terms review, a version/freshness policy, field-level validation, unit documentation, failure behavior, and a provenance entry.

## Synthetic fallback events

`src/services/liveEvents.ts` and `server/context-events.ts` ship three explicitly synthetic demonstration events. They exist only to make the interface stage-safe when public connectors are unavailable. The UI labels this state **SYNTHETIC DEMO EVENTS**; it labels one-feed availability **PARTIAL CONTEXT** and two-feed availability **LIVE CONTEXT**. Every state says that events are not model input.

The fallback must never be described as current operational intelligence. `displayScore` is a Morrow visualization heuristic, not provider severity or an official risk level. A missing provider timestamp remains unavailable and is never replaced with the current time.

## Scenario baselines

Population at risk, economic exposure, hazard curves, fragility, domain biases, and intervention effect coefficients in `src/data/catalog.ts` are illustrative assumptions. Geographic names describe archetypes; they do not identify a current real disaster.

Official reports motivate the problem framing or an intervention category; they do not validate Morrow's numeric effect coefficients. Every intervention coefficient, cap, and deployment delay maps to an ID in `morrow-assumption-pack-1.0.0`, including a selected value, admissible model range, rationale, and `illustrative_unvalidated` status.

## Data minimization

Morrow intentionally excludes:

- names and identifiers;
- household or individual records;
- exact locations of vulnerable people;
- protected critical-infrastructure coordinates;
- user analytics and browsing telemetry;
- private operational plans.

## Source and license review

Official links are provided for traceability. Each institution’s terms govern its data. Before commercial or bulk use, review the current license and attribution terms at the original source. Morrow does not copy report text beyond short factual summaries and does not imply affiliation or endorsement.
