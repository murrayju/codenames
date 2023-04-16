import { spawn } from 'build-strap';

export default async function buildServer() {
  await spawn(
    'vite',
    ['build', '--ssr', 'src/entry-server.tsx', '--outDir', 'dist/server'],
    {
      stdio: 'inherit',
    },
  );
}
