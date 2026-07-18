# Third-party notices

Morrow includes open-source software and font assets. Morrow's own source is
licensed under the repository [MIT license](./LICENSE); that license does not
replace the licenses of the works listed here.

This inventory is tied to `package-lock.json` for Morrow 1.0.0. The JavaScript
rows were derived from the production client source maps, with the direct API
runtime packages added explicitly. Package-manager installations also retain
the license files shipped inside each installed package.

## Production works

| Work | Version | License | Preserved copyright / attribution |
| --- | ---: | --- | --- |
| `@fastify/helmet` | 13.1.0 | MIT | Copyright © 2017–present The Fastify team |
| `@fastify/rate-limit` | 11.1.0 | MIT | Copyright © 2018–present The Fastify team |
| `@fontsource-variable/manrope` / Manrope | 5.2.8 | OFL-1.1 | Copyright 2019 The Manrope Project Authors |
| `@fontsource/space-mono` / Space Mono | 5.2.9 | OFL-1.1 | Copyright 2016 The Space Mono Project Authors |
| `@fontsource/syncopate` / Syncopate | 5.2.8 | Apache-2.0 | Copyright © 2010 Brian J. Bonislawsky DBA Astigmatic (AOETI), including Syncopate Bold |
| `@reduxjs/toolkit` | 2.12.0 | MIT | Copyright © 2018 Mark Erikson |
| `clsx` | 2.1.1 | MIT | Copyright © Luke Edwards |
| `d3-array` | 3.2.4 | ISC | Copyright 2010–2023 Mike Bostock |
| `d3-color` | 3.1.0 | ISC | Copyright 2010–2022 Mike Bostock |
| `d3-ease` | 3.0.1 | ISC | Copyright 2010–2021 Mike Bostock |
| `d3-format` | 3.1.2 | ISC | Copyright 2010–2026 Mike Bostock |
| `d3-geo` | 3.1.1 | ISC, plus embedded MIT notice | Copyright 2010–2024 Mike Bostock; GeographicLib portions copyright 2008–2012 Charles Karney |
| `d3-interpolate` | 3.0.1 | ISC | Copyright 2010–2021 Mike Bostock |
| `d3-path` | 3.1.0 | ISC | Copyright 2015–2022 Mike Bostock |
| `d3-scale` | 4.0.2 | ISC | Copyright 2010–2021 Mike Bostock |
| `d3-shape` | 3.2.0 | ISC | Copyright 2010–2022 Mike Bostock |
| `d3-time` | 3.1.0 | ISC | Copyright 2010–2022 Mike Bostock |
| `d3-time-format` | 4.1.0 | ISC | Copyright 2010–2021 Mike Bostock |
| `d3-timer` | 3.0.1 | ISC | Copyright 2010–2021 Mike Bostock |
| `decimal.js-light` | 2.5.1 | MIT | Copyright © 2020 Michael Mclaughlin |
| `es-toolkit` | 1.49.0 | MIT | Copyright © 2024 Viva Republica, Inc. |
| `eventemitter3` | 5.0.4 | MIT | Copyright © 2014 Arnout Kazemier |
| `fastify` | 5.10.0 | MIT | Copyright © 2016–present The Fastify team |
| `framer-motion` | 12.42.2 | MIT | Copyright © 2018 Framer B.V. |
| `immer` | 11.1.15 | MIT | Copyright © 2017 Michel Weststrate |
| `internmap` | 2.0.3 | ISC | Copyright 2021 Mike Bostock |
| `lucide-react` | 1.24.0 | ISC; selected Feather-derived icons MIT | Copyright © 2026 Lucide Icons and Contributors; Feather-derived icons copyright © 2013–present Cole Bemis |
| `motion-dom` | 12.42.2 | MIT | Copyright © 2024 Motion B.V. |
| `motion-utils` | 12.39.0 | MIT | Copyright © 2024 Motion B.V. |
| `react` | 19.2.7 | MIT | Copyright © Meta Platforms, Inc. and affiliates |
| `react-dom` | 19.2.7 | MIT | Copyright © Meta Platforms, Inc. and affiliates |
| `react-redux` | 9.3.0 | MIT | Copyright © 2015–present Dan Abramov |
| `recharts` | 3.9.2 | MIT | Copyright © 2015–present Recharts |
| `redux` | 5.0.1 | MIT | Copyright © 2015–present Dan Abramov |
| `redux-thunk` | 3.1.0 | MIT | Copyright © 2015–present Dan Abramov |
| `reselect` | 5.2.0 | MIT | Copyright © 2015–2018 Reselect Contributors |
| `scheduler` | 0.27.0 | MIT | Copyright © Meta Platforms, Inc. and affiliates |
| `topojson-client` | 3.1.0 | ISC | Copyright 2012–2019 Michael Bostock |
| `use-sync-external-store` | 1.6.0 | MIT | Copyright © Meta Platforms, Inc. and affiliates |
| `victory-vendor` | 37.3.6 | MIT AND ISC | Formidable; vendored D3 works retain the D3 notices listed above |
| `world-atlas` | 2.0.2 | ISC | Copyright 2013–2019 Michael Bostock; derived from Natural Earth data |
| `zod` | 4.4.3 | MIT | Copyright © 2025 Colin McDonnell |

The corresponding license texts are distributed with every source release and
copied into the static production artifact:

- [MIT](./licenses/MIT.txt)
- [ISC](./licenses/ISC.txt)
- [SIL Open Font License 1.1](./licenses/SIL-OFL-1.1.txt)
- [Apache License 2.0](./licenses/Apache-2.0.txt)

## Additional required notices

`d3-geo` includes GeographicLib material under the MIT license:

> Copyright 2008–2012 Charles Karney

Lucide identifies some icons as derived from the Feather project. Those icon
portions are MIT-licensed:

> Copyright © 2013–present Cole Bemis

Syncopate and Syncopate Bold carry this attribution:

> Copyright © 2010 Brian J. Bonislawsky DBA Astigmatic (AOETI). All rights reserved. Available under the Apache License 2.0.

Manrope and Space Mono are redistributed unmodified under the SIL Open Font
License 1.1. No reserved font name is used for a modified font.

## Maintaining this file

Any production dependency or font update must refresh this inventory, preserve
new package notices, and verify that `dist/THIRD_PARTY_NOTICES.md` plus
`dist/licenses/` are present after `npm run build:client`.
