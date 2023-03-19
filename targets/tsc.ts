import path from 'path';
import { fileURLToPath } from 'url';

import { buildLog, spawn } from 'build-strap';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function tsc() {
  if (process.argv.includes('--no-tsc')) {
    buildLog('Skipping due to --no-tsc');
    return;
  }
  await spawn('tsc', ['--noEmit'], {
    cwd: path.resolve(dirname, '..'),
    shell: true,
    stdio: 'inherit',
  });
}
