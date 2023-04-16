import { spawn } from 'build-strap';
import getPort from 'get-port';

export default async function dev() {
  const localPort = await getPort({ host: '0.0.0.0', port: 8000 });
  await spawn('tsx', ['server.ts'], {
    env: {
      ...process.env,
      PORT: `${localPort}`,
    },
    stdio: 'inherit',
  });
}
