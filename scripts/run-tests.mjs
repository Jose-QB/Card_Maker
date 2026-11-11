import { spawnSync } from 'node:child_process';
import { rejectArguments } from './command-guard.mjs';

if (rejectArguments('npm test')) {
  const result = spawnSync(process.execPath, ['--test'], {
    stdio: 'inherit',
    shell: false
  });

  process.exitCode = result.status ?? 1;
}
