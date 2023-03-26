import type { Request, Response } from 'express';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import path from 'path';
import SseChannel from 'sse-channel';
import { fileURLToPath } from 'url';

import type { ApiContext, ApiResponse } from '../types/api.js';
import { allowDenyFilter } from '../util/array.js';
import logger from '../util/logger.js';

import WordList from './WordList.js';

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
    assassin: await listImagesRandomly('assassin'),
    blue: await listImagesRandomly('blue'),
    bystander: await listImagesRandomly('bystander'),
    red: await listImagesRandomly('red'),
    unknown: [],
  };
  return key.map((k) => `${imageUrlRoot}/${k}/${img[k].splice(0, 1)[0]}`);
};

export type Team = 'red' | 'blue';
export type TileType = Team | 'assassin' | 'bystander' | 'unknown';

export interface GameState {
  gameOver?: boolean;
  gameStarted?: boolean;
  key?: null | TileType[];
  remainingBlue?: number;
  remainingRed?: number;
  revealTileImages?: null | string[];
  revealed?: boolean[];
  totalBlue?: number;
  totalRed?: number;
  turn?: Team;
  words?: string[];
}

export type Role = 'spymaster' | 'operative';

export type Player = {
  id: string;
  name: string;
  role: Role;
  team: Team;
};

export interface PlayerMap {
  [id: string]: Player | undefined;
}

export type GameDbData = {
  id: string;
  lobby?: PlayerMap;
  players?: PlayerMap;
  state?: GameState;
  usedWords?: string[];
  wordListId?: string;
};

type NewGameOptions = {
  wordListId?: string;
};

const gamesCache = new Map<string, Game>();

export default class Game {
  private data: GameDbData;

  private wordList: null | WordList = null;

  private sse: SseChannel;

  // map from clientId to set of SSE connections (Response objects)
  private sseClients: Map<string, Set<Response>>;

  // map from SSE connection (Response object) to clientId
  private sseConnections: WeakMap<Response, string>;

  constructor(data: GameDbData) {
    this.data = data;
    this.sseClients = new Map();
    this.sseConnections = new WeakMap();
    this.sse = new SseChannel<Request, ApiResponse>({ jsonEncode: true })
      .on('connect', (channel, req, res) => {
        const { clientId } = res.locals;
        logger.info('Client connected to SSE stream.', { clientId });
        if (!this.sseClients.has(clientId)) {
          this.sseClients.set(clientId, new Set());
        }
        this.sseClients.get(clientId)?.add(res);
        this.sseConnections.set(res, clientId);
      })
      .on('disconnect', (channel, res) => {
        const clientId = this.sseConnections.get(res);
        logger.info('Client disconnected from SSE stream.', {
          clientId,
        });
        this.sseConnections.delete(res);
        if (clientId) {
          this.sseClients.get(clientId)?.delete(res);
          if (this.sseClients.get(clientId)?.size === 0) {
            this.sseClients.delete(clientId);
          }
          if (this.sseClients.size === 0) {
            logger.info('All clients disconnected');
          }
        }
      });
  }

  get id() {
    return this.data.id;
  }

  get wordListId(): string {
    return this.data.wordListId || 'standard';
  }

  get players(): PlayerMap {
    this.data.players ??= {};
    return this.data.players;
  }

  get lobby(): PlayerMap {
    this.data.lobby ??= {};
    return this.data.lobby;
  }

  get spymasters(): PlayerMap {
    return Object.values(this.players).reduce((acc, p) => {
      if (p?.role === 'spymaster') {
        acc[p.id] = p;
      }
      return acc;
    }, {} as PlayerMap);
  }

  get operatives(): PlayerMap {
    return Object.values(this.players).reduce((acc, p) => {
      if (p?.role === 'operative') {
        acc[p.id] = p;
      }
      return acc;
    }, {} as PlayerMap);
  }

  get usedWords(): WordList {
    return new WordList({
      id: `used-${this.id}`,
      list: this.data.usedWords || [],
    });
  }

  async getWordList(): Promise<WordList> {
    if (!this.wordList) {
      this.wordList = await WordList.get(this.wordListId);
    }
    return this.wordList;
  }

  get state(): GameState {
    if (!this.data.state) {
      this.data.state = {};
    }
    return this.data.state;
  }

  get maskedState(): GameState {
    return {
      ...this.state,
      key: null,
      revealTileImages: this.state.revealTileImages?.map(
        (url, i) => (this.state.revealed?.[i] && url) || '',
      ),
    };
  }

  serialize(masked: boolean): GameDbData {
    this.computeDerivedState();
    const { id, lobby, players, wordListId } = this;
    return {
      id,
      lobby,
      players,
      state: masked ? this.maskedState : this.state,
      wordListId,
    };
  }

  async newWords(): Promise<string[]> {
    const baseList = await this.getWordList();
    const unusedList = baseList.without(this.usedWords);
    if (unusedList.size < 25) {
      this.data.usedWords = [];
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

  async rotateKey(ctx: ApiContext) {
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
    this.data.state = {};
    this.state.revealed = Array.from({ length: 25 }).map(() => false);
    await this.newWords();
    await this.newKey();
  }

  async delete() {
    this.emitToSseClients('connectionClosing');
    this.sse.close();
    this.sseClients.clear();
    this.sseConnections = new WeakMap();
    gamesCache.delete(this.id);
  }

  async connectSseClient(req: Request, res: Response): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.sse.addClient(req, res, (err?: Error) =>
        err ? reject(err) : resolve(),
      );
    });
    this.sse.send({ event: 'connected', id: nanoid() }, [res]);
  }

  emitToSseClients(
    event: string,
    data: null | Record<string, unknown> = null,
    clientAllowList: null | string[] = null,
    clientBlockList: null | string[] = null,
  ): void {
    const clients =
      clientAllowList || clientBlockList
        ? allowDenyFilter(
            [...this.sseClients.keys()],
            clientAllowList,
            clientBlockList,
          ).flatMap((k) => [...(this.sseClients.get(k) || [])])
        : null;
    const count = clients ? clients.length : this.sse.getConnectionCount();
    this.sse.send(
      {
        data,
        event,
        id: (data?.id as string) || nanoid(),
      },
      // if sending to all clients, use null
      count === this.sse.getConnectionCount() ? null : clients,
    );
    logger.debug(`emitted '${event}' event to ${count} client(s) via SSE`, {
      data,
      event,
    });
  }

  computeDerivedState() {
    const { assassinated, remainingBlue, remainingRed } =
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
        { assassinated: false, remainingBlue: 0, remainingRed: 0 },
      ) || {};
    this.state.remainingRed = remainingRed || 0;
    this.state.remainingBlue = remainingBlue || 0;
    this.state.gameOver = !remainingBlue || !remainingRed || assassinated;
    return this.state;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async save(ctx: ApiContext) {
    await this.emitToSseClients(
      'stateChanged',
      this.serialize(true),
      Object.keys(this.operatives).concat(Object.keys(this.lobby)),
    );
    await this.emitToSseClients(
      'stateChanged',
      this.serialize(false),
      Object.keys(this.spymasters),
    );
  }

  async nextTeam() {
    this.state.turn = this.state.turn === 'red' ? 'blue' : 'red';
    return this.state.turn;
  }

  async pass(ctx: ApiContext) {
    await this.nextTeam();
    await this.save(ctx);
    return this.state.turn;
  }

  async startNewRound(ctx: ApiContext) {
    if (this.state.gameOver) {
      this.data.lobby = {
        ...this.data.lobby,
        ...this.data.players,
      };
      this.data.players = {};
      this.data.usedWords = this.usedWords.joinWith(this.state.words).list;
    }
    await this.newRound();
    await this.save(ctx);
  }

  async joinPlayer(ctx: ApiContext, player: Player) {
    this.players[player.id] = player;
    delete this.lobby[player.id];
    await this.save(ctx);
  }

  async joinLobby(ctx: ApiContext, player: Player) {
    this.lobby[player.id] = player;
    delete this.players[player.id];
    await this.save(ctx);
  }

  async selectTile(ctx: ApiContext, index: number) {
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

  static async find(ctx: ApiContext, id: string): Promise<null | Game> {
    // const game: ?GameDbData = await ctx.serverContext.db.collection('games').findOne({ id });
    // if (!game) {
    //   return null;
    // }
    // return new Game(game);
    return gamesCache.get(id) || null;
  }

  static async get(ctx: ApiContext, id: string): Promise<null | Game> {
    const game = await this.find(ctx, id);
    if (!game) {
      throw new Error(`No game found with id '${id}'`);
    }
    return game;
  }

  static async newUniqueId(ctx: ApiContext) {
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

  static async create(ctx: ApiContext, { wordListId }: NewGameOptions = {}) {
    const id = await this.newUniqueId(ctx);
    const game = new Game({ id, wordListId });
    await game.newRound();
    gamesCache.set(id, game);
    return game;
  }
}
