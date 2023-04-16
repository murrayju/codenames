import {
  buildLog,
  dockerContainerRun,
  dockerImages,
  getDockerRepo,
  onKillSignal,
  run,
} from 'build-strap';
import fs from 'fs-extra';
import getPort from 'get-port';

import docker, { getBuildImage, getBuildTag } from './docker.js';

// Run the production docker image
export default async function dockerProd(
  build: boolean = process.argv.includes('--build-docker'),
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

  let cleaning: null | Promise<void> = null;
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
      ],
    });
  } finally {
    // cleanup
    await cleanupAndExit();
  }
}
