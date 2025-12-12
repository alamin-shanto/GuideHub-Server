import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db";
import logger from "./utils/logger";
import app from "./app";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    console.log(
      "Loaded JWT secret:",
      process.env.JWT_SECRET?.slice(0, 6) + "...."
    );

    await connectDB(process.env.MONGO_URI || "");
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    // Pass the error object as structured data so pino/other loggers can serialize it
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

start();
