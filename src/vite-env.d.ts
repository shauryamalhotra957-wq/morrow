/// <reference types="vite/client" />

declare module 'world-atlas/countries-110m.json' {
  const value: {
    type: 'Topology'
    objects: {
      countries: object
    }
    arcs: unknown[]
    transform?: object
  }
  export default value
}
