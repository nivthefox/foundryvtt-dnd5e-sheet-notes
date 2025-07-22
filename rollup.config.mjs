import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/main.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [nodeResolve()]
};