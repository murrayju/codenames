import { Request } from 'express';
import type { Db } from 'mongodb';

import Game from '../api/Game.js';

export interface ServerContext {
  db: Db;
}

export interface ApiRequestContext {
  correlationId: string;
  clientId: string;
  serverContext: ServerContext;
}

export interface GameApiRequestContext extends ApiRequestContext {
  game: Game;
}

export interface ApiRequest extends Request {
  ctx: ApiRequestContext;
}

export interface GameApiRequest extends ApiRequest {
  ctx: GameApiRequestContext;
}
