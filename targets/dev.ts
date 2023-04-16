import { buildLog, onKillSignal, spawn } from 'build-strap';

export default async function dev() {
  let cleaning: Promise<void> | null = null;
  const cleanupAndExit = async () => {
    if (!cleaning) {
      cleaning = (async () => {
        buildLog('Process exiting... cleaning up...');
        process.exit();
      })();
    }
    return cleaning;
  };
  onKillSignal(cleanupAndExit);

  try {
    await spawn('tsx', ['server.ts'], {
      env: process.env,
      stdio: 'inherit',
    });
  } catch (err) {
    console.error(err);
    await cleanupAndExit();
  }
}
