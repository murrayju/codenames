import { ESLint } from 'eslint';
import { buildLog } from 'build-strap';

// Lint the source using eslint
export default async function eslint(autoFix = process.argv.includes('--fix')) {
  if (process.argv.includes('--no-eslint')) {
    buildLog('Skipping due to --no-eslint');
    return null;
  }
  const engine = new ESLint({ fix: autoFix });
  const reports = await engine.lintFiles([
    './src/',
    './targets/',
    './server.ts',
  ]);
  if (autoFix) {
    buildLog('applying automatic eslint fixes');
    ESLint.outputFixes(reports);
  }
  if (
    reports.length &&
    reports.some((report) => report.errorCount || report.warningCount)
  ) {
    const formatter = await engine.loadFormatter();
    buildLog(`eslint results:\n${formatter.format(reports)}`);
  }
  if (reports.some((report) => report.errorCount)) {
    throw new Error('Linting failed');
  }
  return reports;
}
