import config from '@murrayju/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Application } from 'express';

import cookiesMiddleware from 'universal-cookie-express';
import { ViteDevServer } from 'vite';
import bodyParser from 'body-parser';
import nodeFetch from 'node-fetch';
import { handleNodeProcessEvents } from './src/util/nodeProcessEvents.js';
import { ServerContext } from './src/types/api.js';
import * as mongo from './src/util/mongo.js';
import api from './src/api/index.js';
import createFetch, { Fetch } from './src/util/createFetch.js';
import { AppContextData } from './src/contexts/AppContext.js';
import { type RenderResult } from './src/entry-server.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const resolve = (p: string) => path.resolve(dirname, p);

const isTest = process.env.VITEST;
const port = config.get('server.port');

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
  hmrPort?: number,
) {
  handleNodeProcessEvents();

  const indexProd = isProd
    ? fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
    : '';

  const app: Application = express();
  app.set('trust proxy', config.get('server.trustProxy'));
  app.use(express.static(resolve('public')));
  app.use(cookiesMiddleware());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  // initialize the db
  const { db, client: mongoClient } = await mongo.init();
  const serverContext: ServerContext = { db };

  app.use('/api', api(serverContext));

  const serverUrl: string =
    config.get('server.serverUrl') || `http://localhost:${port}`;
  const clientUrl = config.get('server.clientUrl');

  let vite: ViteDevServer | null = null;
  if (!isProd) {
    vite = await (
      await import('vite')
    ).createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true,
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
        hmr: {
          port: hmrPort,
        },
      },
      appType: 'custom',
    });
    // use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    app.use((await import('compression')).default());
    app.use(
      (await import('serve-static')).default(resolve('dist/client'), {
        index: false,
      }),
    );
  }

  app.use('*', async (req, res) => {
    try {
      // @ts-ignore
      const cookies = req.universalCookies;
      const url = req.originalUrl;

      const fetch = createFetch(nodeFetch as Fetch, {
        baseUrl: serverUrl,
        cookie: req.headers.cookie,
      });

      const context: AppContextData = {
        fetch,
        cookies,
      };

      let template: string;
      let render: (url: string, context: AppContextData) => RenderResult;
      if (!isProd && vite) {
        // always read fresh template in dev
        template = fs.readFileSync(resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render;
      } else {
        template = indexProd;
        // @ts-ignore
        // eslint-disable-next-line import/extensions
        render = (await import('./dist/server/entry-server.js')).render;
      }

      const { appHtml, appCss } = render(url, context);
      const html = template
        .replace(`<!--app-html-->`, appHtml)
        .replace(`/*app-css*/`, appCss)
        .replace(`/*app-js*/`, `window.App={apiUrl:'${clientUrl}'}`);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      !isProd && vite?.ssrFixStacktrace(e as Error);
      console.error((e as Error).stack);
      res.status(500).end((e as Error).stack);
    }
  });

  return { app, vite, mongoClient };
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(port, () => {
      console.info(`http://localhost:${port}`);
    }),
  );
}
