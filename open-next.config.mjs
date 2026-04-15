// open-next.config.mjs
// NOTA: open-next (versión open-source) en modo cloudflare ejecuta TODO en edge runtime.
// No se requiere (ni se permite) declarar `export const runtime = 'edge'` en rutas individuales.
export default {
  default: {
    placement: 'regional',
    runtime: 'edge',
    override: {
      wrapper: 'cloudflare',
      converter: 'edge',
    },
  },
};
