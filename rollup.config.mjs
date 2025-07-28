import { nodeResolve } from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import copy from 'rollup-plugin-copy';
import * as yaml from 'js-yaml';
import { readFileSync } from 'fs';

// Read license from LICENSE file and format as banner
const licenseText = readFileSync('./LICENSE', 'utf-8').trim();
const banner = `/**\n * ${licenseText.split('\n').join('\n * ')}\n **/`;

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/main.js',
    format: 'es',
    sourcemap: true,
    banner
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