import { Response } from 'express';

import Game from '../api/Game.js';

export interface ServerContext {}

export interface ApiContext {
  clientId: string;
  correlationId: string;
  serverContext: ServerContext;
}

export interface GameApiContext extends ApiContext {
  game: Game;
}

export type ApiResponse = Response<any, ApiContext>;
export type GameApiResponse = Response<any, GameApiContext>;
