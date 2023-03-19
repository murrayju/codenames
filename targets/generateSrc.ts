import { buildLog, getVersionCode } from 'build-strap';
import prettier from 'prettier';
import fs from 'fs-extra';

// Pass the generated code through eslint,
// which auto-formats it and write out the clean output file
const lintAndWrite = async (code: string, filepath: string) => {
  const options = await prettier.resolveConfig(filepath);
  const text = await prettier.format(code, { ...options, filepath });
  await fs.writeFile(filepath, text);
  buildLog(`Generated file: ${filepath}`);
};

// Code generation
export default async function generateSrc() {
  if (process.argv.includes('--no-generate-src')) {
    buildLog('Skipping due to --no-generate-src');
    return;
  }

  await fs.ensureDir('./src');
  await lintAndWrite(
    `${await getVersionCode()}\nexport default version;`,
    './src/version._generated_.ts',
  );
}
