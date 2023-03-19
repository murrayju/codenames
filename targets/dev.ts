import {
  buildLog,
  dockerNetworkCreate,
  onKillSignal,
  spawn,
} from 'build-strap';
import { ensureDir } from 'fs-extra';
import { dockerTeardown, runDbContainer } from './docker';

export default async function dev(runDb = !process.argv.includes('--no-db')) {
  const network = 'codenames-tdd';

  let cleaning: Promise<void> | null = null;
  const cleanupAndExit = async () => {
    if (!cleaning) {
      cleaning = (async () => {
        buildLog('Process exiting... cleaning up...');
        await dockerTeardown();
        buildLog('Cleanup finished.');
        process.exit();
      })();
    }
    return cleaning;
  };
  onKillSignal(cleanupAndExit);

  try {
    if (runDb) {
      await dockerNetworkCreate(network);
      await ensureDir('./db/data-tdd');
      const { port } = await runDbContainer();
      process.env.DB_ENABLED = 'true';
      process.env.DB_HOST = `mongodb://localhost:${port}`;
    }
    await spawn('tsx', ['server.ts'], {
      env: process.env,
      stdio: 'inherit',
    });
  } catch (err) {
    console.error(err);
    await cleanupAndExit();
  }
}
