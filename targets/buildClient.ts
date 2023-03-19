import { spawn } from 'build-strap';

export default async function buildClient() {
  await spawn('vite', ['build', '--outDir', 'dist/client'], {
    stdio: 'inherit',
  });
}
