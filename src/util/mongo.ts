import config from '@murrayju/config';
import { type Db, type IndexDescription, MongoClient } from 'mongodb';

interface DbCollection {
  indexes: IndexDescription[];
}

interface DbConfig {
  collections: Record<string, DbCollection>;
  name: string;
  password: string;
  url: string;
  user: string;
}

let mongoDb: null | Db = null;
let mongoClient: null | MongoClient = null;

export async function init(): Promise<{ client: MongoClient; db: Db }> {
  const { password, url, user } = config.get<DbConfig>('db');
  const client = await MongoClient.connect(url, {
    ...(user && password
      ? {
          auth: {
            password,
            username: user,
          },
        }
      : null),
  });
  mongoClient = client;

  // get/create the database
  const db = mongoClient.db(config.get('db.name'));
  mongoDb = db;

  // ensure all indexes exist
  await Promise.all(
    Object.entries(
      config.get('db.collections') as Record<string, DbCollection>,
    ).map(async ([name, cfg]) => {
      if (cfg.indexes?.length) {
        await db.collection(name).createIndexes(cfg.indexes);
      }
    }),
  );

  return { client, db };
}

export async function destroy(passed: null | Db | MongoClient = mongoClient) {
  if (passed) {
    if (mongoClient && (passed === mongoDb || passed === mongoClient)) {
      await mongoClient.close();
      mongoDb = null;
      mongoClient = null;
    } else if (passed === mongoClient) {
      await passed.close();
    }
  }
}

export function getDb(): null | Db {
  return mongoDb;
}

export function getClient(): null | MongoClient {
  return mongoClient;
}
