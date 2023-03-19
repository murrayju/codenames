/* eslint-disable import/extensions */
import config from '@murrayju/config';
import path from 'path';
import express, { Application } from 'express';
import webpack, { Configuration, EntryObject } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware';
import {
  format,
  onKillSignal,
  buildLog,
  dockerNetworkCreate,
} from 'build-strap';
import fs from 'fs-extra';
import chokidar from 'chokidar';

import { fileURLToPath } from 'url';
import webpackConfig from '../webpack.config';
import run from './run.js';
import clean from './clean.js';
import lint from './lint.js';
import { runDbContainer, dockerTeardown } from './docker.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const hmrPrefix = '[\x1b[35mHMR\x1b[0m] ';

function createCompilationPromise(name, compiler, cfg) {
  return new Promise((resolve, reject) => {
    let timeStart = new Date();
    compiler.hooks.compile.tap(name, () => {
      timeStart = new Date();
      console.info(`[${format(timeStart)}] Compiling '${name}'...`);
    });

    compiler.hooks.done.tap(name, (stats) => {
      console.info(stats.toString(cfg.stats));
      const timeEnd = new Date();
      const time = timeEnd.getTime() - timeStart.getTime();
      if (stats.hasErrors()) {
        console.info(
          `[${format(timeEnd)}] Failed to compile '${name}' after ${time} ms`,
        );
        reject(new Error('Compilation failed!'));
      } else {
        console.info(
          `[${format(
            timeEnd,
          )}] Finished '${name}' compilation after ${time} ms`,
        );
        resolve(stats);
      }
    });
  });
}

/**
 * Launches a development web server with "live reload" functionality -
 * synchronizing URLs, interactions and code changes across multiple devices.
 */
async function start(
  runDatabase = !process.argv.includes('--tdd-no-db') &&
    !process.argv.includes('--tdd-no-docker'),
  noDocker = process.argv.includes('--tdd-no-docker'),
) {
  // initial lint
  await run(lint);

  // Doesn't resolve until kill signal sent
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<void>(async (outerResolve) => {
    const network = 'codenames-tdd';

    let cleaning: Promise<void> | null = null;
    let cfgWatcher: chokidar.FSWatcher | null = null;
    const cleanupAndExit = async () => {
      if (!cleaning) {
        cleaning = (async () => {
          buildLog('Process exiting... cleaning up...');
          cfgWatcher?.close();
          await dockerTeardown();
          buildLog('Cleanup finished.');
          outerResolve();
          process.exit();
        })();
      }
      return cleaning;
    };
    onKillSignal(cleanupAndExit);

    try {
      if (!noDocker) {
        await dockerNetworkCreate(network);
      }
      if (runDatabase) {
        await fs.ensureDir('./db/data-tdd');
        const { port } = await runDbContainer();
        process.env.DB_ENABLED = 'true';
        process.env.DB_HOST = `mongodb://localhost:${port}`;
      }

      const server = express();
      server.use(errorOverlayMiddleware());
      server.use(express.static(path.resolve(dirname, '../public')));

      // Configure client-side hot module replacement
      const clientConfig = webpackConfig.find(
        (cfg) => cfg.name === 'client',
      ) as Configuration;
      if (!clientConfig) throw new Error('No client config found');
      (clientConfig.entry as EntryObject).client = [
        './tools/lib/webpackHotDevClient',
      ]
        .concat((clientConfig.entry as EntryObject).client as string[])
        .sort((a, b) => b.includes('polyfill') - a.includes('polyfill'));
      // clientConfig.output.filename = clientConfig.output.filename.replace(
      //   'chunkhash',
      //   'hash',
      // );
      // clientConfig.output.chunkFilename =
      //   clientConfig.output.chunkFilename.replace('chunkhash', 'hash');
      clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

      // Configure server-side hot module replacement
      const serverConfig = webpackConfig.find((cfg) => cfg.name === 'server');
      if (!serverConfig) throw new Error('No server config found');
      serverConfig.output.hotUpdateMainFilename =
        'updates/[hash].hot-update.json';
      serverConfig.output.hotUpdateChunkFilename =
        'updates/[id].[hash].hot-update.js';
      serverConfig.plugins.push(new webpack.HotModuleReplacementPlugin());

      // Configure compilation
      await run(clean);
      const multiCompiler = webpack(webpackConfig);
      // @ts-ignore
      const clientCompiler = multiCompiler.compilers.find(
        (compiler) => compiler.name === 'client',
      );
      // @ts-ignore
      const serverCompiler = multiCompiler.compilers.find(
        (compiler) => compiler.name === 'server',
      );
      const clientPromise = createCompilationPromise(
        'client',
        clientCompiler,
        clientConfig,
      );
      const serverPromise = createCompilationPromise(
        'server',
        serverCompiler,
        serverConfig,
      );

      // https://github.com/webpack/webpack-dev-middleware
      server.use(
        webpackDevMiddleware(clientCompiler, {
          publicPath: clientConfig.output.publicPath,
        }),
      );

      // https://github.com/glenjamin/webpack-hot-middleware
      server.use(webpackHotMiddleware(clientCompiler, { log: false }));

      let appPromise;
      let appPromiseResolve;
      let appPromiseIsResolved = true;
      serverCompiler?.hooks.compile.tap('server', () => {
        if (!appPromiseIsResolved) return;
        appPromiseIsResolved = false;
        appPromise = new Promise((resolve) => {
          appPromiseResolve = resolve;
        });
      });

      let app: Application | null = null;
      let destroy: null | (() => Promise<void>) = null;
      server.use((req, res) => {
        appPromise
          .then(() => app?.handle(req, res))
          .catch((error) => console.error(error));
      });

      const recreateApp = async () => {
        console.warn(`${hmrPrefix}Recreating the app...`);
        await destroy?.();
        ({ app, destroy } = await (
          await import('../build/server.js')
        ).createApp());
        console.warn(`${hmrPrefix}App has been reloaded.`);
      };

      // eslint-disable-next-line no-inner-declarations
      const checkForUpdate = (fromUpdate = false) => {
        if (!app.hot) {
          throw new Error(`${hmrPrefix}Hot Module Replacement is disabled.`);
        }
        if (app.hot.status() !== 'idle') {
          return Promise.resolve();
        }
        return app.hot
          .check(true)
          .then((updatedModules) => {
            if (!updatedModules) {
              if (fromUpdate) {
                console.info(`${hmrPrefix}Update applied.`);
              }
              return;
            }
            if (updatedModules.length === 0) {
              console.info(`${hmrPrefix}Nothing hot updated.`);
            } else {
              console.info(`${hmrPrefix}Updated modules:`);
              updatedModules.forEach((moduleId) =>
                console.info(`${hmrPrefix} - ${moduleId}`),
              );
              checkForUpdate(true);
            }
          })
          .catch(async (error) => {
            if (['abort', 'fail'].includes(app.hot.status())) {
              console.warn(`${hmrPrefix}Cannot apply update.`);
              await recreateApp();
            } else {
              console.warn(
                `${hmrPrefix}Update failed: ${error.stack || error.message}`,
              );
            }
          });
      };

      serverCompiler.watch({}, (error, stats) => {
        if (app && !error && !stats.hasErrors()) {
          checkForUpdate().then(() => {
            appPromiseIsResolved = true;
            appPromiseResolve();
          });
        }
      });

      cfgWatcher = chokidar.watch(['./config/*.yml'], {
        ignoreInitial: true,
        ignored: /.*\._generated_\..*/,
        usePolling: process.argv.includes('--poll-fs'),
      });

      cfgWatcher.on('all', async (event, filePath) => {
        const src = path.relative('./', filePath);
        buildLog(`Detected ${event} to '${src}'`);
        await recreateApp();
      });

      // Wait until both client-side and server-side bundles are ready
      await clientPromise;
      await serverPromise;

      const timeStart = new Date();
      console.info(`[${format(timeStart)}] Launching server...`);

      // Load compiled src/server.js as a middleware
      ({ app, destroy } = await (
        await import('../build/server.js')
      ).createApp());
      appPromiseIsResolved = true;
      appPromiseResolve();

      // // Launch the development server with Browsersync and HMR
      // await new Promise((resolve, reject) => {
      //   browserSync.create().init(
      //     {
      //       // https://www.browsersync.io/docs/options
      //       server: 'src/server.jsx',
      //       port: config.get('server.port'),
      //       middleware: [server],
      //       open: !process.argv.includes('--silent'),
      //       ghostMode: false,
      //       ...(isDebug ? {} : { notify: false, ui: false }),
      //     },
      //     (error, bs) => (error ? reject(error) : resolve(bs)),
      //   );
      // });
      server.listen(config.get('server.port'));

      const timeEnd = new Date();
      const time = timeEnd.getTime() - timeStart.getTime();
      console.info(`[${format(timeEnd)}] Server launched after ${time} ms`);
    } catch (err) {
      buildLog(`Something in tdd threw an exception: ${err.toString()}`);
      console.error(err);
      await cleanupAndExit();
    }
  });
}

export default start;
