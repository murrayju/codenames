import config from '@murrayju/config';
import { union, without } from 'lodash-es';
import { nanoid } from 'nanoid';

interface WordListDbData {
  id: string;
  list: string[];
  name?: string;
}

interface WordListDbDataMap {
  [id: string]: WordListDbData;
}

interface WordListMap {
  [id: string]: WordList;
}

export default class WordList {
  #data: WordListDbData;

  constructor({ id, ...data }: WordListDbData) {
    this.#data = {
      ...data,
      id: id || nanoid(),
    };
  }

  get id(): string {
    return this.#data.id;
  }

  get name(): string {
    return this.#data.name || '';
  }

  get list(): string[] {
    return this.#data.list || [];
  }

  get size(): number {
    return this.list.length || 0;
  }

  getRandomList(count: number = 25) {
    if (count > this.size) {
      throw new Error('List too small');
    }
    return Array.from({ length: this.size })
      .map((v, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map((i) => this.list[i]);
  }

  getRandomId(wordCount: number = 4): string {
    return this.getRandomList(wordCount).join('-');
  }

  joinWith(words?: null | (WordList | string[])): WordList {
    return new WordList({
      id: nanoid(),
      list: union(
        this.list,
        (words instanceof WordList ? words.list : words) || [],
      ),
    });
  }

  without(words?: null | (WordList | string[])): WordList {
    return new WordList({
      id: nanoid(),
      list: without(
        this.list,
        ...((words instanceof WordList ? words.list : words) || []),
      ),
    });
  }

  static async getMap(): Promise<WordListMap> {
    return (await this.getAll()).reduce(
      (obj, w) =>
        Object.assign(obj, {
          [w.id]: w,
        }),
      {},
    );
  }

  static async getAll(): Promise<WordList[]> {
    return Object.entries(config.get('words') as WordListDbDataMap).map(
      // @ts-ignore
      ([id, value]) => new this({ id, ...value }),
    );
  }

  static async find(id: string): Promise<null | WordList> {
    return (await this.getMap())[id] || null;
  }

  static async get(id: string): Promise<WordList> {
    const list = await this.find(id);
    if (!list) {
      throw new Error(`Failed to find WordList with id '${id}'`);
    }
    return list;
  }
}
