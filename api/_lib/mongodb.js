import mongoose from 'mongoose';
import dns from 'dns';

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not set in environment variables.');
}

const MONGODB_URI = process.env.MONGODB_URI;

// Some local ISPs / Windows DNS configurations block MongoDB Atlas SRV
// record lookups (`_mongodb._tcp.*.mongodb.net`). Force Node to use public
// resolvers so dev never fails for that reason. On Vercel this is harmless.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // ignore only fails on extremely locked-down environments
}

// Cache the connection across hot-reloads in dev and warm Lambda invocations
// to avoid creating a new connection on every request.
let cached = global.__mongooseCache;
if (!cached) {
  cached = global.__mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
