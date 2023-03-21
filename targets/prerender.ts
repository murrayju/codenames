// Pre-render the app into static HTML.
// run `yarn generate` and then `dist/static` can be served as a static site.

import { run } from 'build-strap';
import { outputFile } from 'fs-extra';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { RenderResult } from '../src/entry-server.js';

import build from './build';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const resolve = (p: string) => path.resolve(dirname, p);

export default async function prerender() {
  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) {
    throw new Error('CLIENT_URL must be set');
  }
  await run(build);
  const template = await readFile(
    resolve('../dist/client/index.html'),
    'utf-8',
  );
  // @ts-ignore
  // eslint-disable-next-line import/extensions
  const { render } = await import('../dist/server/entry-server.js');

  // determine routes to pre-render from src/pages
  const routesToPrerender = (await readdir(resolve('src/pages'))).map(
    (file) => {
      const name = file.replace(/\.tsx$/, '').toLowerCase();
      return name === 'root' ? `/` : `/${name}`;
    },
  );

  // pre-render each route...
  for (const url of routesToPrerender) {
    const context = {};
    const renderResult: RenderResult = await render(url, context);
    const { appCss, appHtml } = renderResult;

    const html = template
      .replace(`<!--app-html-->`, appHtml)
      .replace(`/*app-css*/`, appCss)
      .replace(`/*app-js*/`, `window.App={apiUrl:'${clientUrl}'}`);

    const filePath = `../dist/static${url === '/' ? '/index' : url}.html`;
    await outputFile(resolve(filePath), html);
    console.info('pre-rendered:', filePath);
  }
}
