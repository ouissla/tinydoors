import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { root } from './build.mjs';
for (const folder of ['js', 'js3d', 'server', 'tools', 'tests']) {
  for (const file of await readdir(new URL('../' + folder + '/', import.meta.url))) {
    if (!/\.(js|mjs)$/.test(file)) continue;
    const check = spawnSync(process.execPath, ['--check', folder + '/' + file], { cwd: root, encoding: 'utf8' });
    if (check.status !== 0) { process.stderr.write(check.stderr); process.exit(1); }
  }
}
console.log('JavaScript syntax checks passed.');
