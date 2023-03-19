import run from './run.js';
import clean from './clean.js';
import buildClient from './buildClient.js';
import buildServer from './buildServer.js';
import eslint from './eslint.js';
import tsc from './tsc.js';
import yarn from './yarn.js';
import generateSrc from './generateSrc.js';

/**
 * Compiles the project from source files into a distributable
 * format and copies it to the output (build) folder.
 */
async function build() {
  await run(clean);
  await run(yarn);
  await run(generateSrc);
  await run(eslint);
  await run(tsc);
  await run(buildClient);
  await run(buildServer);
}

export default build;
