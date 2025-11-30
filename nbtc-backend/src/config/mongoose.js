import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();
const dbName = process.env.MONGO_DB_NAME || "nbtc";
const mongoURI = process.env.MONGO_URI || "mongodb://nbtc-db:27017";

export const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      dbName: dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
