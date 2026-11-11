import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { rejectArguments } from './command-guard.mjs';

const require = createRequire(import.meta.url);
const viteCli = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

const command = process.argv[2];

if (!command) {
  console.error('Falta el comando de Vite.');
  process.exitCode = 2;
} else if (rejectArguments(`npm run ${command}`, process.argv.slice(3))) {
  const result = spawnSync(process.execPath, [viteCli, command], {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error(`No se pudo ejecutar Vite: ${result.error.message}`);
  }

  process.exitCode = result.status ?? 1;
}
