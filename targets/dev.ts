import { spawn } from 'build-strap';

export default async function dev() {
  await spawn('tsx', ['server.ts'], { stdio: 'inherit' });
}
