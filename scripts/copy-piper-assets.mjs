import { cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'node_modules', 'piper-tts-web', 'dist');
const dest = path.join(root, 'public');

const DIRS = ['piper', 'onnx', 'worker'];
const EXCLUDED = new Set([
  'worker/OnnxWebGPUWorker.js',
  'onnx/ort-wasm-simd-threaded.jsep.wasm',
]);

for (const dir of DIRS) {
  const from = path.join(dist, dir);
  if (!existsSync(from)) {
    console.warn(`[copy-piper-assets] omitido: no existe ${path.relative(root, from)}`);
    continue;
  }
  const to = path.join(dest, dir);
  mkdirSync(to, { recursive: true });
  cpSync(from, to, {
    recursive: true,
    filter: (source) => {
      const rel = path.relative(dist, source).split(path.sep).join('/');
      return !EXCLUDED.has(rel);
    },
  });
  console.log(`[copy-piper-assets] ${dir}/ -> public/${dir}/`);
}
