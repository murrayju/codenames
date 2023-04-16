import { run, runCli, setPkg } from 'build-strap';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

setPkg(require('../package.json'));

runCli({ resolveFn: async (path: string) => import(`./${path}.ts`) });

export default run;
