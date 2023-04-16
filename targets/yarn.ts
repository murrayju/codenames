import { buildLog, yarnInstall } from 'build-strap';

// Download javascript dependencies (using yarn)
export default async function yarn() {
  if (process.argv.includes('--yarn-skip')) {
    buildLog('Skipping due to --yarn-skip');
    return;
  }
  await yarnInstall();
}
