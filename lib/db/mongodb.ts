import { MongoClient, ServerApiVersion, type MongoClientOptions } from "mongodb";
import { serverEnv } from "@/lib/env";

/**
 * Global variable reference to preserve MongoDB client across hot module reloading in development.
 */
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = serverEnv.MONGODB_URI;

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

let clientPromise: Promise<MongoClient>;

if (!uri) {
  // Graceful fallback during build step when MONGODB_URI might not be set
  clientPromise = Promise.reject(
    new Error(
      "[VasukiPublication DB Error] MONGODB_URI is not configured. Please set MONGODB_URI in your environment or .env.local file."
    )
  );
} else if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value is preserved across module reloads
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      console.error("[VasukiPublication DB] Failed to connect to MongoDB:", err.message);
      // Reset global promise on connection error so subsequent attempts can retry
      global._mongoClientPromise = undefined;
      throw err;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a standard client instance
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

/**
 * Returns the cached MongoClient promise.
 */
export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

/**
 * Returns the connected MongoDB database instance.
 */
export async function getDatabase(dbName?: string) {
  const client = await getMongoClient();
  const databaseName = dbName || serverEnv.MONGODB_DATABASE || "vasukisquare";
  return client.db(databaseName);
}

export default clientPromise;
