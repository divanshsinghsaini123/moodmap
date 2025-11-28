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

/** Extend NodeJS.Global so TS knows about _mongoose */
declare global {
  namespace NodeJS {
    interface Global {
      _mongoose?: MongooseConnection;
    }
  }
}

// cast `global` to the extended NodeJS.Global type
const globalForMongoose = global as unknown as NodeJS.Global;

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
