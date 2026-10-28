import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  memServer?: any;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function getMongoUri(): Promise<string> {
  // If an Atlas or external URI is explicitly provided (and not the default uncontactable local port), use it
  if (
    process.env.MONGODB_URI &&
    process.env.MONGODB_URI !== "mongodb://127.0.0.1:27017/accesshub" &&
    process.env.MONGODB_URI !== "mongodb://localhost:27017/accesshub"
  ) {
    return process.env.MONGODB_URI;
  }

  // Attempt connecting to local port 27017 first if configured
  if (process.env.MONGODB_URI) {
    try {
      const net = await import("net");
      const isPortOpen = await new Promise<boolean>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(800);
        socket.on("connect", () => {
          socket.destroy();
          resolve(true);
        });
        socket.on("timeout", () => {
          socket.destroy();
          resolve(false);
        });
        socket.on("error", () => {
          socket.destroy();
          resolve(false);
        });
        socket.connect(27017, "127.0.0.1");
      });

      if (isPortOpen) {
        return process.env.MONGODB_URI;
      }
    } catch {
      // Fallback to memory server
    }
  }

  // Fallback to in-memory MongoDB replica set for reliable local dev and transactions
  if (!cached.memServer) {
    const { MongoMemoryReplSet } = await import("mongodb-memory-server");
    const replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: "wiredTiger" },
    });
    cached.memServer = replSet;
  }

  return cached.memServer.getUri("accesshub");
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      const uri = await getMongoUri();
      return mongoose.connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
      });
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
  if (cached.memServer) {
    await cached.memServer.stop();
    cached.memServer = null;
  }
}

export default connectToDatabase;
