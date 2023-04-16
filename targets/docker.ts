import {
  buildLog,
  dockerBuild,
  dockerComposeTeardown,
  dockerTag,
  getDockerId,
  getDockerRepo,
  getUniqueBuildTag,
  getVersion,
} from 'build-strap';
import fs from 'fs-extra';

export async function getBuildTag() {
  return `build-${await getUniqueBuildTag()}`;
}

export async function getBuildImage(tag: null | string) {
  return `${getDockerRepo()}:${tag || (await getBuildTag())}`;
}

// Build the project using docker
export default async function docker() {
  if (process.argv.includes('--no-docker')) {
    buildLog('Skipping due to --no-docker');
    return;
  }

  // ensure that these files exist, so that we can guarantee to stash them
  await Promise.all(
    ['./latest.build.tag', './latest.build.id'].map(async (f) =>
      fs.ensureFile(f),
    ),
  );

  const v = await getVersion();
  const buildTag = await getBuildTag();
  await fs.writeFile('./latest.build.tag', buildTag);

  await dockerBuild(['latest-build', buildTag], [`BUILD_NUMBER=${v.build}`]);
  const buildId = await getDockerId(buildTag);
  await fs.writeFile('./latest.build.id', buildId);

  // determine what tags to apply
  if (v.isRelease) {
    await dockerTag(buildId, [
      'latest',
      `${v.major}`,
      `${v.major}.${v.minor}`,
      `${v.major}.${v.minor}.${v.patch}`,
    ]);
  } else if (v.branch === 'default') {
    await dockerTag(buildId, ['latest-dev']);
  } else if (v.branch.match(/^(release|patch)-/)) {
    await dockerTag(buildId, ['latest-rc']);
  } else if (v.branch.match(/^feature-/)) {
    await dockerTag(buildId, ['latest-feature']);
  }

  buildLog(`Successfully built production docker image: ${buildId}`);
}

export async function dockerTeardown() {
  await dockerComposeTeardown();
}
