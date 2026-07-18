# Accessibility Contract

Morrow is intended for projected classroom use, individual exploration, and facilitated tabletop exercises. Accessibility is part of the product contract, not a post-release visual check.

## Implemented interaction support

- semantic headings, landmarks, buttons, labels, lists, tables, and dialog markup;
- a skip link to main content;
- keyboard-operable navigation, sliders, portfolio cards, disclosure controls, and command palette;
- visible focus states;
- native range inputs with labels and value text;
- text/table alternatives for charts and map values;
- reduced-motion behavior through the user's motion preference;
- responsive navigation for narrow screens;
- status messages exposed through live regions;
- no meaning conveyed by animation alone;
- no audio-only content.

## Claim boundary

Automated smoke testing can catch only a subset of accessibility failures. A “no detectable violations” result is not a WCAG conformance certification. The current release must not claim formal WCAG conformance until a documented manual audit covers every critical view and interaction.

## Manual release checklist

Test the production build, not only the development server.

### Keyboard

1. Reach the skip link immediately after page load.
2. Traverse every interactive element in a logical order.
3. Operate all sliders with arrow, Page Up/Down, Home, and End where supported.
4. Open and close the command palette and decision brief without losing focus.
5. Confirm focus never disappears behind sticky navigation or the modal backdrop.
6. Complete the full rehearsal without a pointer.

### Screen reader

Test at least one desktop combination such as NVDA/Firefox or VoiceOver/Safari:

- page and region names are understandable;
- scenario and model-boundary text is announced before concrete outputs are interpreted;
- charts expose an equivalent data table;
- map context and modeled values have meaningful text;
- slider names and current allocations are announced;
- toast messages do not interrupt essential reading;
- dialog title, controls, and close behavior are clear.

### Visual

- inspect text and controls at 200% browser zoom;
- test 320 CSS pixels without horizontal page scrolling, except intentionally scrollable data tables;
- verify normal, hover, focus, disabled, selected, warning, and error states;
- check color contrast with a standards-based tool;
- confirm color is never the only indicator of risk, selection, or delta;
- enable reduced motion and confirm that no essential state depends on movement.

### Cognitive and model comprehension

- label every shipped scenario as fictional or illustrative before users see precise numbers;
- keep “not an operational forecast” visible in the workflow and brief;
- avoid unexplained acronyms and define normalized 0–100 model scores;
- do not use animation speed, alarm language, or pulsing status as evidence of real-world urgency;
- let facilitators pause the cascade and inspect assumptions at their own pace.

## Supported content changes

Any new chart, custom control, animation, modal, navigation item, or generated document must include:

1. a keyboard path;
2. an accessible name and state;
3. a nonvisual equivalent for essential information;
4. reduced-motion behavior where relevant;
5. responsive and zoom testing;
6. an automated check plus manual review.

## Reporting

An accessibility report should include the affected version, browser, assistive technology, viewport, exact steps, expected behavior, actual behavior, and whether the issue blocks the critical rehearsal journey. Do not include private crisis plans or personal data in a public report.
