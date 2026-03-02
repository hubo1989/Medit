// Type shim for vega-embed
// Keeps TypeScript (moduleResolution: node) happy while runtime bundling uses the package entry.

declare module 'vega-embed' {
  const embed: typeof import('vega-embed/build/embed').default;
  export default embed;
}
