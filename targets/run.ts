import { createRequire } from 'module';

import { run, runCli, setPkg } from 'build-strap';

const require = createRequire(import.meta.url);

setPkg(require('../package.json'));

runCli({ resolveFn: async (path: string) => import(`./${path}.ts`) });

export default run;
