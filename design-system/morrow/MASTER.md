# Morrow production design system

This file documents the interface that ships in `src/`. It is a reference for extending Morrow, not a generated alternative theme. Page-specific notes in `pages/`, when present, override only the named page.

## Product and visual direction

- **Product category:** local-first crisis rehearsal and decision-intelligence teaching tool
- **Mode:** dark, high-contrast operations cockpit
- **Character:** calm under pressure, technical, inspectable, and deliberately non-militaristic
- **Composition:** spacious narrative landing page followed by a denser cockpit of bounded panels, metrics, controls, maps, charts, and evidence tables
- **Core visual cue:** lime marks the current action or modeled focus; cyan, amber, red, violet, green, blue, and yellow distinguish system states and intervention families

The interface must keep its fictional-scenario and unvalidated-output boundaries visible. Visual confidence must never imply forecast certainty.

## Production stack

- React 19 + TypeScript + Vite
- CSS custom properties and responsive CSS in `src/styles.css`
- Framer Motion for route, reveal, card, and toast transitions
- Recharts for comparison and time-series graphics
- Lucide React for interface icons
- D3 Geo + TopoJSON for the conceptual world canvas
- Fontsource packages for fonts bundled with the application

No runtime font request is required. `src/main.tsx` imports Manrope Variable, Syncopate 400/700, and Space Mono 400/700 from local package assets.

## Color tokens

The source of truth is the `:root` block in `src/styles.css`.

| Token | Value | Role |
|---|---:|---|
| `--bg-0` | `#050c0a` | page and app shell |
| `--bg-1` | `#07120f` | elevated background |
| `--bg-2` | `#0a1814` | section background |
| `--bg-3` | `#0e201a` | highest dark surface |
| `--surface` | `rgba(11, 27, 22, 0.86)` | translucent panel |
| `--surface-strong` | `#0b1b16` | solid panel |
| `--surface-soft` | `rgba(17, 39, 32, 0.72)` | quiet panel |
| `--line` | `rgba(154, 198, 181, 0.13)` | default divider |
| `--line-strong` | `rgba(185, 255, 102, 0.23)` | emphasized divider |
| `--text` | `#edf7f2` | primary copy |
| `--text-soft` | `#c2d2cc` | secondary copy |
| `--muted` | `#8ba198` | supporting copy |
| `--muted-2` | `#82978f` | metadata and labels |
| `--lime` | `#b9ff66` | primary action and active focus |
| `--lime-dark` | `#81bc3c` | lime depth |
| `--cyan` | `#39d9ff` | signal / comparison accent |
| `--amber` | `#ffba69` | caution and timeline accent |
| `--red` | `#ff7b7b` | stress and destructive state |
| `--violet` | `#dba7ff` | intervention/system accent |
| `--green` | `#63efb0` | ready and positive state |
| `--blue` | `#5f8dff` | informational state |
| `--yellow` | `#f4e65d` | secondary warning state |

Never use accent color alone to communicate status. Pair it with a label, icon, shape, or value.

## Typography

| Token | Family | Use |
|---|---|---|
| `--font-body` | Manrope Variable, Segoe UI, sans-serif | prose, buttons, headings, controls |
| `--font-display` | Syncopate, Arial Black, sans-serif | brand and compact display labels |
| `--font-mono` | Space Mono, Consolas, monospace | metrics, timestamps, model metadata, technical labels |

- Body defaults to `16px / 1.5`.
- Page headings use Manrope with tight negative tracking; Syncopate is reserved for the brand and short labels so dense text remains readable.
- The release readability floor raises dense metadata and brief labels to at least 10px in the final stylesheet layer. Do not bypass that layer with smaller component-specific values.
- Use tabular, monospaced presentation for comparable values. Keep explanatory prose in Manrope.

## Shape, depth, and layout

| Token | Value |
|---|---:|
| `--radius-sm` | `8px` |
| `--radius-md` | `13px` |
| `--radius-lg` | `20px` |
| `--radius-xl` | `30px` |
| `--shadow` | `0 24px 80px rgba(0, 0, 0, 0.28)` |

- Panels use restrained borders and subtle dark depth; they do not depend on heavy shadows for separation.
- The landing page may use larger radii and atmospheric radial backgrounds. Cockpit surfaces stay compact and rectilinear.
- Responsive breakpoints are `1320px`, `1100px`, `800px`, and `480px`.
- The minimum supported viewport is 320px. Grids must use `minmax(0, …)`, long metadata must wrap, and the document must not scroll horizontally.
- At 800px and below, the cockpit uses a top scenario selector and four-item bottom navigation. Touch controls have a minimum 44px target.

## Components

### Buttons

- Primary actions use the lime treatment and dark text.
- Secondary and quiet actions use transparent dark surfaces and a visible border.
- Destructive or stress actions use the red semantic treatment.
- Hover and press feedback uses small translation, border, background, or glow changes; it must not reflow surrounding content.
- Every icon-only control requires an accessible name and a 44px target.

### Panels and metric cards

- Base panels use `--surface`, `--line`, and `--radius-md`.
- A panel may strengthen its border on hover only on hover-capable devices.
- Metric cards pair a plain-language label, large monospaced value, interpretation text, and data/status cue.
- Values and caveats may wrap; fixed card heights must never clip meaning.

### Forms and ranges

- Controls have persistent labels. Placeholders are hints, never the only label.
- Keyboard focus uses a 2px `--lime` outline with a 3px offset.
- Range controls show progress in lime, preserve native keyboard behavior, and expose their current value in adjacent text.
- Validation or storage errors appear through the toast region with an explicit error state.

### Navigation, dialogs, and overlays

- Desktop cockpit navigation exposes the four primary views and marks the active route with `aria-current`.
- The command palette is a labeled dialog with combobox/listbox semantics, a visible close control, backdrop dismissal, keyboard navigation, and focus restoration.
- The decision brief is a scrollable dialog on screen and a print-formatted A4 document when printed.

### Charts and the conceptual map

- Charts include labels, legends, and textual summaries. Color is supplementary.
- Tooltip surfaces use the same dark panel language.
- The map is explicitly a conceptual system-pressure canvas, not a geospatial impact forecast.
- Live, partial, and synthetic signal modes are named in text; unknown event times display `timestamp unavailable`.

## Motion

- Global Framer Motion timing is `280ms` with easing `[0.22, 1, 0.36, 1]`.
- Cockpit route changes use a short fade and vertical shift with `AnimatePresence` in wait mode.
- Landing reveals use opacity plus a small vertical offset; the hero model preview also uses a restrained scale entrance.
- Toasts and portfolio cards use motion to clarify arrival, dismissal, or selection—not as decoration.
- CSS transitions for controls generally run `180–300ms`.
- `MotionConfig reducedMotion="user"` and the `prefers-reduced-motion` CSS block remove nonessential movement. Any new animation must inherit or explicitly honor those controls.

## Accessibility and interaction contract

- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text or essential non-text controls.
- Preserve visible keyboard focus; never remove it without a component-level replacement.
- Keep all primary touch targets at least 44×44px with adequate spacing.
- Provide semantic headings, region labels, accessible chart/map descriptions, and textual equivalents for modeled graphics.
- Keep route headings focusable for screen-reader and keyboard orientation after navigation.
- Support zoom and text reflow. Never disable viewport scaling.
- Respect 320px, 375px, 768px, 1024px, and 1440px layout checks.

## Content rules

- Prefer “illustrative,” “teaching model,” “proxy,” “assumption,” and “context signal” where those are the actual data contracts.
- Never label synthetic fallback events as live or current.
- Never invent event recency. If a provider or synthetic record has no timestamp, show `timestamp unavailable`.
- Never state that a context source calibrates the model unless the assumption registry explicitly says so.
- Keep objective, intervention, and metric labels consistent across the cockpit, evidence ledger, exports, and decision brief.

## Pre-release checklist

- [ ] Production tokens in this file still match `src/styles.css`.
- [ ] Fonts load from bundled Fontsource assets.
- [ ] Framer Motion and CSS animation both honor reduced-motion preferences.
- [ ] Every interactive icon has an accessible name and a 44px target.
- [ ] Keyboard focus is visible and dialogs restore focus.
- [ ] Status is not communicated by color alone.
- [ ] Charts and the conceptual map have textual equivalents.
- [ ] Synthetic/partial/live signal modes and missing timestamps are truthful.
- [ ] No horizontal page overflow at 320px or 375px.
- [ ] Decision brief remains readable on screen and in A4 print output.
