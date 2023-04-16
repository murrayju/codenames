import { spawn } from 'build-strap';
import getPort from 'get-port';

import build from './build';
import run from './run';

export default async function prod(
  doBuild = !process.argv.includes('--no-build'),
) {
  if (doBuild) {
    await run(build);
  }
  const localPort = await getPort({ host: '0.0.0.0', port: 8123 });
  await spawn('tsx', ['server.ts'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: `${localPort}`,
    },
    stdio: 'inherit',
  });
}
