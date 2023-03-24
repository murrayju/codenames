import cookieParser from 'cookie-parser';
import cors from 'cors';
import { NextFunction, Request, Response } from 'express';
import Router from 'express-promise-router';
import { nanoid } from 'nanoid';

import { ApiResponse, GameApiResponse, ServerContext } from '../types/api.js';
import { StatusError } from '../types/error.js';
import logger from '../util/logger.js';
import { version } from '../util/version._generated_.js'; // eslint-disable-line import/no-unresolved

import Game from './Game.js';
import WordList from './WordList.js';

// Middleware factory
export default function api(serverContext: ServerContext) {
  const router = Router();

  router.use(cors());
  router.use(cookieParser());
  // all requests get a correlationId and clientId
  router.use((req: Request, res: ApiResponse, next: NextFunction) => {
    // use a cookie to identify clients
    const clientId = req.cookies.clientId || nanoid();
    res.cookie('clientId', clientId);
    res.locals = {
      clientId,
      correlationId: nanoid(),
      serverContext,
    };
    next();
  });

  router.get('/', (req: Request, res: ApiResponse) => {
    res.json({ ready: true });
  });

  router.get('/version', (req: Request, res: ApiResponse) => {
    res.json(version);
  });

  router.get('/wordList', async (req: Request, res: ApiResponse) => {
    res.json(await WordList.getAll());
  });

  router.post('/game', async (req: Request, res: ApiResponse) => {
    const game = await Game.create(res.locals, req.body);
    res.json(await game.serialize(true));
  });

  router.use(
    '/game/:id',
    async (req: Request, res: GameApiResponse, next: NextFunction) => {
      const game = await Game.find(res.locals, req.params.id);
      if (!game) {
        res.status(404).send('Not found');
        return;
      }
      res.locals.game = game;
      next();
    },
  );

  router.get('/game/:id', async (req: Request, res: GameApiResponse) => {
    res.json(
      await res.locals.game.serialize(
        !res.locals.game.spymasters[res.locals.clientId],
      ),
    );
  });

  router.get('/game/:id/events', async (req: Request, res: GameApiResponse) => {
    await res.locals.game.connectSseClient(req, res);
  });

  router.post('/game/:id/join', async (req: Request, res: GameApiResponse) => {
    await res.locals.game.joinPlayer(res.locals, {
      ...req.body,
      id: res.locals.clientId,
    });
    res.status(204).send();
  });

  router.post(
    '/game/:id/selectTile/:tileIndex',
    async (req: Request, res: GameApiResponse) => {
      await res.locals.game.selectTile(
        res.locals,
        parseInt(req.params.tileIndex, 10),
      );
      res.status(204).send();
    },
  );

  router.post('/game/:id/pass', async (req: Request, res: GameApiResponse) => {
    await res.locals.game.pass(res.locals);
    res.status(204).send();
  });

  router.post(
    '/game/:id/newRound',
    async (req: Request, res: GameApiResponse) => {
      await res.locals.game.startNewRound(res.locals);
      res.status(204).send();
    },
  );

  router.post(
    '/game/:id/rotateKey',
    async (req: Request, res: GameApiResponse) => {
      await res.locals.game.rotateKey(res.locals);
      res.status(204).send();
    },
  );

  // Custom error handler
  router.use(
    (
      err: StatusError,
      req: Request,
      res: Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      next: NextFunction,
    ) => {
      const statusCode: number =
        (typeof err.statusCode === 'number'
          ? err.statusCode
          : err.statusCode
          ? parseInt(err.statusCode, 10)
          : null) || 500;
      logger.debug(
        `Exception caught in top level express error handler: ${err.message}`,
      );
      let logLevel = 'info';
      if (statusCode === 401) {
        // auth failures aren't a real problem
        logLevel = 'debug';
      } else if (statusCode >= 500) {
        // 500 errors represent an internal server error
        logLevel = 'error';
      }
      logger.log(logLevel, err.toString(), err);
      const { message } = err;
      res.status(statusCode).json({ message });
    },
  );

  return router;
}
