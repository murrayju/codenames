import { run, buildLog } from 'build-strap';
import cleanBuild from './cleanBuild.js';
import cleanDeps from './cleanDeps.js';

export default async function clean() {
  if (process.argv.includes('--no-clean')) {
    buildLog('Skipping due to --no-clean');
    return;
  }
  await run(cleanBuild);
  if (process.argv.includes('--clean-deps')) {
    await run(cleanDeps);
  }
}
