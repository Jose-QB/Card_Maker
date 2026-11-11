import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { rejectArguments } from './command-guard.mjs';

const require = createRequire(import.meta.url);
const viteCli = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');

if (rejectArguments('npm run check')) {
  const testResult = spawnSync(process.execPath, ['scripts/run-tests.mjs'], {
    stdio: 'inherit',
    shell: false
  });

  if (testResult.status !== 0) {
    process.exitCode = testResult.status ?? 1;
  } else {
    const buildResult = spawnSync(process.execPath, [viteCli, 'build'], {
      stdio: 'inherit',
      shell: false
    });

    if (buildResult.error) {
      console.error(`No se pudo ejecutar Vite: ${buildResult.error.message}`);
    }

    process.exitCode = buildResult.status ?? 1;
  }
}
