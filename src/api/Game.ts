import type { Request, Response } from 'express';
import fs from 'fs-extra';
import { nanoid } from 'nanoid';
import path from 'path';
import SseChannel from 'sse-channel';
import { fileURLToPath } from 'url';

import type { ApiContext, ApiResponse } from '../types/api.js';
import { allowDenyFilter } from '../util/array.js';
import logger from '../util/logger.js';

import { ClueSuggestion, getClueSuggestion } from './openai.js';
import WordList from './WordList.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const imagesRoot = path.resolve(dirname, '../../public/static/images');
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
  winner?: null | Team;
  words?: string[];
}

export type Role = 'spymaster' | 'operative';
export type Location = 'lobby' | 'table';

export type Player = {
  id: string;
  location: Location;
  name: string;
  role: Role;
  team: Team;
};

export interface PlayerMap {
  [id: string]: Player | undefined;
}

export type GameDbData = {
  id: string;
  players?: PlayerMap;
  state?: GameState;
  usedWords?: string[];
  wordListId?: string;
};

type NewGameOptions = {
  wordListId?: string;
};

const gamesCache = new Map<string, Game>();

export interface LogMessage {
  clientId: string | null;
  id: string;
  message: string;
}

export default class Game {
  private data: GameDbData;

  private wordList: null | WordList = null;

  private sse: SseChannel;

  // map from clientId to set of SSE connections (Response objects)
  private sseClients: Map<string, Set<Response>>;

  // map from SSE connection (Response object) to clientId
  private sseConnections: WeakMap<Response, string>;

  logMessages: LogMessage[];

  constructor(data: GameDbData) {
    this.data = data;
    this.logMessages = [];
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
          setTimeout(() => {
            if (this.sseClients.get(clientId)?.size === 0) {
              const player = this.data.players?.[clientId];
              if (player?.name) {
                this.logMessage(res.locals, `${player.name} has disconnected`);
              }
              this.sseClients.delete(clientId);
              delete this.data.players?.[clientId];
              this.save();
            }
          }, 10000);
          setTimeout(() => {
            if (this.sseClients.size === 0) {
              logger.info('All clients disconnected, deleting game');
              gamesCache.delete(this.id);
            }
          }, 5 * 60 * 1000);
        }
      });

    // For testing many players on screen
    // this.data.players = Array.from(
    //   { length: 100 },
    //   (_, i): Player => ({
    //     id: nanoid(),
    //     location: i % 3 === 0 ? 'table' : 'lobby',
    //     name: `Player ${i}`,
    //     role: 'operative',
    //     team: i % 2 === 0 ? 'red' : 'blue',
    //   }),
    // ).reduce((acc, p) => {
    //   acc[p.id] = p;
    //   return acc;
    // }, {} as PlayerMap);
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

  player(ctx: ApiContext): Player | null {
    return this.players[ctx.clientId] || null;
  }

  playerName(ctx: ApiContext): string {
    return this.player(ctx)?.name || ctx.clientId;
  }

  get lobby(): PlayerMap {
    return Object.values(this.players).reduce((acc, p) => {
      if (p?.location === 'lobby') {
        acc[p.id] = p;
      }
      return acc;
    }, {} as PlayerMap);
  }

  get spymasters(): PlayerMap {
    return Object.values(this.players).reduce((acc, p) => {
      if (p?.role === 'spymaster' && p?.location === 'table') {
        acc[p.id] = p;
      }
      return acc;
    }, {} as PlayerMap);
  }

  get operatives(): PlayerMap {
    return Object.values(this.players).reduce((acc, p) => {
      if (p?.role === 'operative' && p?.location === 'table') {
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
    const { id, players, wordListId } = this;
    return {
      id,
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
    await this.logMessage(
      ctx,
      `${this.playerName(ctx)} rotated the secret key`,
    );
    await this.save();
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
    const { clientId } = res.locals;
    this.sse.send({ data: { clientId }, event: 'connected', id: nanoid() }, [
      res,
    ]);
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
    this.state.winner = this.state.gameOver
      ? assassinated
        ? this.state.turn === 'blue'
          ? 'red'
          : 'blue'
        : !remainingBlue
        ? 'blue'
        : !remainingRed
        ? 'red'
        : null
      : null;
    return this.state;
  }

  async save() {
    this.computeDerivedState();
    if (this.state.gameOver) {
      // reveal the key to all when game ends
      await this.emitToSseClients('stateChanged', this.serialize(false));
      return;
    }
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

  async logMessage(ctx: ApiContext, message: string) {
    const log = {
      clientId: ctx.clientId,
      id: nanoid(),
      message,
    };
    this.logMessages.push(log);
    if (this.logMessages.length > 100) {
      this.logMessages.shift();
    }
    await this.emitToSseClients('logMessage', log);
  }

  async nextTeam(ctx: ApiContext) {
    this.state.turn = this.state.turn === 'red' ? 'blue' : 'red';
    await this.logMessage(ctx, `It is now the ${this.state.turn} team's turn.`);
    return this.state.turn;
  }

  async pass(ctx: ApiContext) {
    await this.logMessage(ctx, `${this.playerName(ctx)} has elected to pass`);
    await this.nextTeam(ctx);
    await this.save();
    return this.state.turn;
  }

  async startNewRound(ctx: ApiContext) {
    if (this.state.gameOver) {
      for (const player of Object.values(this.players)) {
        if (player) {
          player.location = 'lobby';
        }
      }
      this.data.usedWords = this.usedWords.joinWith(this.state.words).list;
    }
    await this.newRound();
    await this.logMessage(ctx, `${this.playerName(ctx)} started a new round.`);
    await this.save();
  }

  async joinPlayer(ctx: ApiContext, player: Player) {
    this.players[player.id] = {
      ...player,
      location: 'table',
    };
    await this.logMessage(
      ctx,
      `${player.name} has joined as ${player.role} for team ${player.team}!`,
    );
    await this.save();
  }

  async joinLobby(ctx: ApiContext, player: Player) {
    const existed = this.players[player.id]?.location === 'lobby';
    this.players[player.id] = {
      ...player,
      location: 'lobby',
    };
    if (!existed) {
      await this.logMessage(
        ctx,
        `${player.name || 'A new player'} has entered the lobby!`,
      );
    }
    await this.save();
  }

  async selectTile(ctx: ApiContext, index: number) {
    if (!this.state.revealed || index >= this.state.revealed.length) {
      throw new Error('Invalid tile index');
    }
    if (this.state.gameOver) {
      throw new Error('Game is over');
    }
    this.state.gameStarted = true;
    this.state.revealed[index] = true;
    const tileType = this.state.key?.[index];
    await this.logMessage(
      ctx,
      `${this.playerName(ctx)} has selected "${
        this.state.words?.[index] || ''
      }", revealing a ${tileType} tile.`,
    );
    this.computeDerivedState();
    if (this.state.gameOver && this.state.winner) {
      await this.logMessage(
        ctx,
        `The ${this.state.winner} team has won the game!`,
      );
    } else if (tileType !== this.state.turn) {
      await this.nextTeam(ctx);
    }
    await this.save();
  }

  getImages() {
    return [...(this.state.revealTileImages || [])].sort();
  }

  async getSuggestion(ctx: ApiContext): Promise<ClueSuggestion> {
    const player = this.player(ctx);
    if (!player) {
      throw new Error('Player not found');
    }
    if (player.role !== 'spymaster') {
      throw new Error('Only spymasters can get hints');
    }
    const key = this.state.key || [];
    const state = key.reduce(
      (acc, type, i) => {
        const revealed = this.state.revealed?.[i] || false;
        if (revealed) {
          return acc;
        }
        const word = this.state.words?.[i] || '';
        if (!word) {
          throw new Error('Unexpected empty word');
        }
        if (type === player.team) {
          acc.words.push(word);
        } else if (type === 'assassin') {
          acc.assassinWord = word;
        } else if (type === 'red' || type === 'blue') {
          acc.opponentWords.push(word);
        } else {
          acc.bystanderWords.push(word);
        }
        return acc;
      },
      {
        assassinWord: '',
        bystanderWords: [] as string[],
        opponentWords: [] as string[],
        words: [] as string[],
      },
    );
    await this.logMessage(
      ctx,
      `${this.playerName(ctx)} has asked for an AI suggestion.`,
    );
    return getClueSuggestion(state);
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
