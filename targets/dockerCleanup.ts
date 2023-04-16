import { dockerCleanup } from 'build-strap';

export default async function doDockerCleanup(
  purgeAll: boolean = process.argv.includes('--purge-all'),
  purgeOld: boolean = process.argv.includes('--purge-old'),
) {
  await dockerCleanup({ purgeAll, purgeOld });
}
