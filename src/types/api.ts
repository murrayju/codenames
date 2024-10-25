import { Response } from 'express';

import Game from '../api/Game.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ServerContext {}

export interface ApiContext {
  clientId: string;
  correlationId: string;
  serverContext: ServerContext;
}

export interface GameApiContext extends ApiContext {
  game: Game;
}

export type ApiResponse = Response<unknown, ApiContext>;
export type GameApiResponse = Response<unknown, GameApiContext>;
