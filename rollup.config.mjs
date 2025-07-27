import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';
import * as yaml from 'js-yaml';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/main.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [
    json(),
    nodeResolve(),
    copy({
      targets: [
        {
          src: ['./src/lang/*.yaml'],
          dest: './dist/lang',
          transform: (content) => {
            const lang = yaml.load(content);
            return JSON.stringify(lang, null, 2);
          },
          rename: (name) => `${name}.json`
        }
      ]
    })
  ]
};