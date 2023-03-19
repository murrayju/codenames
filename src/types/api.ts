import { Response } from 'express';
import type { Db } from 'mongodb';

import Game from '../api/Game.js';

export interface ServerContext {
  db: Db;
}

export interface ApiContext {
  correlationId: string;
  clientId: string;
  serverContext: ServerContext;
}

export interface GameApiContext extends ApiContext {
  game: Game;
}

export type ApiResponse = Response<any, ApiContext>;
export type GameApiResponse = Response<any, GameApiContext>;
