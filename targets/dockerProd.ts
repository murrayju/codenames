import {
  buildLog,
  dockerContainerRun,
  dockerImages,
  dockerNetworkDelete,
  dockerTryStopContainer,
  getDockerRepo,
  onKillSignal,
  run,
} from 'build-strap';
import fs from 'fs-extra';
import getPort from 'get-port';

import docker, {
  getBuildImage,
  getBuildTag,
  runDbContainer,
} from './docker.js';

// Run the production docker image
export default async function dockerProd(
  build: boolean = process.argv.includes('--build-docker'),
  integration: boolean = !process.argv.includes('--no-integration'),
) {
  await fs.ensureFile('./latest.build.tag');
  const tag = await getBuildTag();
  if (
    build ||
    !(await dockerImages(getDockerRepo())).find((m) => m.tag === tag)
  ) {
    buildLog('Image does not exist, running docker build...');
    await run(docker);
  }

  const network = 'codenames-production';
  let db: null | string = null;
  let dbHost: null | undefined | string = null;
  let dbPort: null | undefined | number = null;

  let cleaning: null | Promise<void> = null;
  const cleanupAndExit = async () => {
    if (!cleaning) {
      cleaning = (async () => {
        buildLog('Process exiting... cleaning up...');
        await dockerTryStopContainer(db, 'db');
        try {
          await dockerNetworkDelete(network);
        } catch (err) {
          buildLog(
            `Failed to delete network (probably does not exist): ${
              (err as Error).message
            }`,
          );
        }
        process.exit();
      })();
    }
    return cleaning;
  };

  onKillSignal(cleanupAndExit);

  try {
    if (integration) {
      ({
        dockerPort: dbPort,
        dockerUrl: dbHost,
        id: db,
      } = await runDbContainer());
    }

    const dockerPort = 80;
    const localPort = await getPort({ host: '0.0.0.0', port: 8008 });

    buildLog(
      `Starting server, to be available at https://localhost:${localPort}`,
    );

    await dockerContainerRun({
      image: await getBuildImage(tag),
      runArgs: [
        '--rm',
        '-it',
        '-p',
        `${localPort}:${dockerPort}`,
        '-e',
        `PORT=${dockerPort}`,
        ...(integration
          ? [
              ...(dbHost && dbPort
                ? [
                    '-e',
                    'DB_ENABLED=true',
                    '-e',
                    `DB_HOST=mongodb://${dbHost}:${dbPort}`,
                  ]
                : []),
              `--network=${network}`,
            ]
          : []),
      ],
    });
  } finally {
    // cleanup
    await cleanupAndExit();
  }
}
