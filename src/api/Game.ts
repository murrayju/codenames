import path from 'path';
import { nanoid } from 'nanoid';
import fs from 'fs-extra';
import SseChannel from 'sse-channel';
import type { Request, Response } from 'express';

import { fileURLToPath } from 'url';
import logger from '../util/logger.js';
import WordList from './WordList.js';
import { allowDenyFilter } from '../util/array.js';
import type { ApiRequest, ApiRequestContext } from '../types/api.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const imagesRoot = path.resolve(
  dirname,
  process.env.NODE_ENV === 'production' ? './' : '../',
  '../public/static/images',
);
const imageUrlRoot = '/static/images';
const listImagesRandomly = async (subDir: string) =>
  (await fs.readdir(path.resolve(imagesRoot, subDir))).sort(
    () => Math.random() - 0.5,
  );
const getImages = async (key: TileType[]) => {
  const img = {
    red: await listImagesRandomly('red'),
    blue: await listImagesRandomly('blue'),
    assassin: await listImagesRandomly('assassin'),
    bystander: await listImagesRandomly('bystander'),
    unknown: [],
  };
  return key.map((k) => `${imageUrlRoot}/${k}/${img[k].splice(0, 1)[0]}`);
};

export type Team = 'red' | 'blue';
export type TileType = Team | 'assassin' | 'bystander' | 'unknown';

export interface GameState {
  turn?: Team;
  key?: null | TileType[];
  revealTileImages?: null | string[];
  words?: string[];
  revealed?: boolean[];
  totalRed?: number;
  totalBlue?: number;
  remainingRed?: number;
  remainingBlue?: number;
  gameStarted?: boolean;
  gameOver?: boolean;
}

export type Role = 'spymaster' | 'operative';

export type Player = {
  id: string;
  name: string;
  role: Role;
  team: Team;
};

export type GameDbData = {
  id: string;
  wordListId?: string;
  state?: GameState;
  players?: Player[];
  usedWords?: string[];
};

type NewGameOptions = {
  wordListId?: string;
};

const gamesCache = new Map<string, Game>();

export default class Game {
  #data: GameDbData;

  #wordList: null | WordList = null;

  #sse: SseChannel;

  #sseClients: Map<string, Set<Response>>;

  #sseConnections: WeakMap<Response, string>;

  constructor(data: GameDbData) {
    this.#data = data;
    this.#sseClients = new Map();
    this.#sseConnections = new WeakMap();
    this.#sse = new SseChannel<ApiRequest, Response>({ jsonEncode: true })
      .on('connect', (channel, req, res) => {
        const { clientId } = req.ctx;
        logger.info('Client connected to SSE stream.', { clientId });
        if (!this.#sseClients.has(clientId)) {
          this.#sseClients.set(clientId, new Set());
        }
        this.#sseClients.get(clientId)?.add(res);
        this.#sseConnections.set(res, clientId);
      })
      .on('disconnect', (channel, res) => {
        const clientId = this.#sseConnections.get(res);
        logger.info('Client disconnected from SSE stream.', {
          clientId,
        });
        this.#sseConnections.delete(res);
        if (clientId) {
          this.#sseClients.get(clientId)?.delete(res);
          if (this.#sseClients.get(clientId)?.size === 0) {
            this.#sseClients.delete(clientId);
          }
          if (this.#sseClients.size === 0) {
            logger.info('All clients disconnected');
          }
        }
      });
  }

  get id() {
    return this.#data.id;
  }

  get wordListId(): string {
    return this.#data.wordListId || 'standard';
  }

  get players(): Player[] {
    return this.#data.players || [];
  }

  get usedWords(): WordList {
    return new WordList({
      id: `used-${this.id}`,
      list: this.#data.usedWords || [],
    });
  }

  async getWordList(): Promise<WordList> {
    if (!this.#wordList) {
      this.#wordList = await WordList.get(this.wordListId);
    }
    return this.#wordList;
  }

  get state(): GameState {
    if (!this.#data.state) {
      this.#data.state = {};
    }
    return this.#data.state;
  }

  async serialize(): Promise<GameDbData> {
    await this.computeDerivedState();
    const { id, state, wordListId, players } = this;
    return {
      id,
      state,
      wordListId,
      players,
    };
  }

  async newWords(): Promise<string[]> {
    const baseList = await this.getWordList();
    const unusedList = baseList.without(this.usedWords);
    if (unusedList.size < 25) {
      this.#data.usedWords = [];
      this.state.words = baseList.getRandomList(25);
    } else {
      this.state.words = unusedList.getRandomList(25);
    }
    return this.state.words;
  }

  async newKey(): Promise<TileType[]> {
    const first = Math.random() > 0.5 ? 'red' : 'blue';
    this.state.totalRed = first === 'red' ? 9 : 8;
    this.state.totalBlue = first === 'blue' ? 9 : 8;
    this.state.turn = first;
    const key: TileType[] = [
      ...(['red', 'blue'] as const).flatMap((c: TileType) =>
        Array.from({ length: first === c ? 9 : 8 }).map(() => c),
      ),
      ...Array.from({ length: 7 }).map(() => 'bystander' as const),
      'assassin' as const,
    ].sort(() => Math.random() - 0.5);
    this.state.key = key;
    this.state.revealTileImages = await getImages(key);
    return key;
  }

  async rotateKey(ctx: ApiRequestContext) {
    if (this.state.gameStarted) {
      throw new Error('Cannot rotate key after game has started.');
    }
    const { key } = this.state;
    if (!key) {
      throw new Error('No key exists to rotate');
    }
    // 90deg clockwise
    const newKey = key.map(
      (_, i) => key[(4 - (i % 5)) * 5 + Math.floor(i / 5)],
    );
    this.state.key = newKey;
    await this.save(ctx);
    return newKey;
  }

  async newRound() {
    this.#data.state = {};
    this.state.revealed = Array.from({ length: 25 }).map(() => false);
    await this.newWords();
    await this.newKey();
  }

  async delete() {
    this.emitToSseClients('connectionClosing');
    this.#sse.close();
    this.#sseClients.clear();
    this.#sseConnections = new WeakMap();
    gamesCache.delete(this.id);
  }

  async connectSseClient(req: Request, res: Response): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.#sse.addClient(req, res, (err?: Error) =>
        err ? reject(err) : resolve(),
      );
    });
    this.#sse.send({ id: nanoid(), event: 'connected' }, [res]);
  }

  emitToSseClients(
    event: string,
    data: null | Record<string, unknown> = null,
    clientWhiteList: null | string[] = null,
    clientBlackList: null | string[] = null,
  ): void {
    const clients =
      clientWhiteList || clientBlackList
        ? allowDenyFilter(
            [...this.#sseClients.keys()],
            clientWhiteList,
            clientBlackList,
          ).flatMap((k) => [...(this.#sseClients.get(k) || [])])
        : null;
    const count = clients ? clients.length : this.#sse.getConnectionCount();
    this.#sse.send(
      {
        id: (data?.id as string) || nanoid(),
        event,
        data,
      },
      // if sending to all clients, use null
      count === this.#sse.getConnectionCount() ? null : clients,
    );
    logger.debug(`emitted '${event}' event to ${count} client(s) via SSE`, {
      event,
      data,
    });
  }

  async computeDerivedState() {
    const { remainingRed, remainingBlue, assassinated } =
      this.state.key?.reduce(
        (res, type, i) => {
          if (!this.state.revealed?.[i]) {
            if (type === 'red') {
              res.remainingRed += 1;
            } else if (type === 'blue') {
              res.remainingBlue += 1;
            }
          } else if (type === 'assassin') {
            res.assassinated = true;
          }
          return res;
        },
        { remainingRed: 0, remainingBlue: 0, assassinated: false },
      ) || {};
    this.state.remainingRed = remainingRed || 0;
    this.state.remainingBlue = remainingBlue || 0;
    this.state.gameOver = !remainingBlue || !remainingRed || assassinated;
    return this.state;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async save(ctx: ApiRequestContext) {
    await this.emitToSseClients('stateChanged', await this.serialize());
  }

  async nextTeam() {
    this.state.turn = this.state.turn === 'red' ? 'blue' : 'red';
    return this.state.turn;
  }

  async pass(ctx: ApiRequestContext) {
    await this.nextTeam();
    await this.save(ctx);
    return this.state.turn;
  }

  async startNewRound(ctx: ApiRequestContext) {
    if (this.state.gameOver) {
      this.#data.players = [];
      this.#data.usedWords = this.usedWords.joinWith(this.state.words).list;
    }
    await this.newRound();
    await this.save(ctx);
  }

  async joinPlayer(ctx: ApiRequestContext, player: Player) {
    this.#data.players = [...this.players, player];
    await this.save(ctx);
  }

  async selectTile(ctx: ApiRequestContext, index: number) {
    if (!this.state.revealed || index >= this.state.revealed.length) {
      throw new Error('Invalid tile index');
    }
    this.state.gameStarted = true;
    this.state.revealed[index] = true;
    const tileType = this.state.key?.[index];
    if (tileType !== this.state.turn) {
      await this.nextTeam();
    }
    await this.save(ctx);
  }

  static async find(ctx: ApiRequestContext, id: string): Promise<null | Game> {
    // const game: ?GameDbData = await ctx.serverContext.db.collection('games').findOne({ id });
    // if (!game) {
    //   return null;
    // }
    // return new Game(game);
    return gamesCache.get(id) || null;
  }

  static async get(ctx: ApiRequestContext, id: string): Promise<null | Game> {
    const game = await this.find(ctx, id);
    if (!game) {
      throw new Error(`No game found with id '${id}'`);
    }
    return game;
  }

  static async newUniqueId(ctx: ApiRequestContext) {
    const wl = await WordList.get('standard');
    let id = null;
    let attempts = 10;
    /* eslint-disable no-await-in-loop */
    while (wl && attempts > 0) {
      id = wl.getRandomId(3);
      if (!(await this.find(ctx, id))) {
        return id;
      }
      attempts -= 1;
    }
    /* eslint-enable no-await-in-loop */
    return nanoid();
  }

  static async create(
    ctx: ApiRequestContext,
    { wordListId }: NewGameOptions = {},
  ) {
    const id = await this.newUniqueId(ctx);
    const game = new Game({ id, wordListId });
    await game.newRound();
    gamesCache.set(id, game);
    return game;
  }
}
