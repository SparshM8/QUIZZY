import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer | undefined;
let useMemory: boolean;

export async function setupDatabase(): Promise<void> {
  const mongoUri = process.env.TEST_MONGO_URI ?? process.env.MONGODB_URI;
  if (mongoUri) {
    useMemory = false;
    await mongoose.connect(mongoUri);
    return;
  }
  useMemory = true;
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

export async function teardownDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (useMemory && mongod) {
    await mongod.stop();
  }
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
