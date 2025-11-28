// src/lib/mongoose.ts
import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/** Single typed connection cache shared across hot reloads */
interface MongooseConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

/**
 * Augment globalThis so TypeScript knows about _mongoose.
 * Using `GlobalThis` avoids `namespace` usage and the `no-namespace` lint rule.
 */
declare global {
  interface GlobalThis {
    _mongoose?: MongooseConnection;
  }
}

// use typed globalThis alias
const globalForMongoose = globalThis as typeof globalThis & {
  _mongoose?: MongooseConnection;
};

let cached = globalForMongoose._mongoose;

if (!cached) {
  cached = { conn: null, promise: null };
  globalForMongoose._mongoose = cached;
}

export async function connectToDatabase(): Promise<Mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: process.env.MONGODB_DB,
      })
      .then((m) => m);
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}
