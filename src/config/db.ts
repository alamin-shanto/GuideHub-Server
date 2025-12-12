// src/config/db.ts
import mongoose from "mongoose";
import logger from "../utils/logger";

const DEFAULT_DB = "GuideHub";

async function connectDB(mongoUri?: string) {
  const uri = (mongoUri || process.env.MONGO_URI || "").trim();

  if (!uri) {
    const err = new Error("MONGO_URI not set");
    logger.error(err);
    throw err;
  }

  // Detect if URI already contains a database name (e.g. /GuideHub? or /GuideHub$)
  const hasDbInUri = /\/[A-Za-z0-9_\-]+(\?|$)/.test(uri);

  // Only set dbName explicitly if the URI lacks a database.
  const connectOptions: mongoose.ConnectOptions = hasDbInUri
    ? {}
    : { dbName: process.env.DB_NAME || DEFAULT_DB };

  await mongoose.connect(uri, connectOptions);
  logger.info(
    `MongoDB connected (host: ${mongoose.connection.host}, db: ${mongoose.connection.name})`
  );
  return mongoose.connection;
}

export default connectDB;
