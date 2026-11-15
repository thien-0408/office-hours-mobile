/**
 * Imported first in index.js.
 *
 * @react-three/fiber's native build does `require('three')`, which resolves to
 * three.cjs; that file calls Node's `process.emitWarning` (a deprecation note),
 * which React Native's `process` shim lacks — the call throws at module load
 * and the app never registers. A no-op keeps the warning harmless.
 */
if (typeof global.process === 'undefined') {
  global.process = {};
}
if (typeof global.process.emitWarning !== 'function') {
  global.process.emitWarning = () => {};
}
