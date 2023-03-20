import { buildLog } from 'build-strap';
import { remove } from 'fs-extra';

export default async function cleanBuild() {
  if (process.argv.includes('--no-clean-build')) {
    buildLog('Skipping due to --no-clean-build');
    return;
  }
  await remove('./dist');
  await remove('./out');
}
