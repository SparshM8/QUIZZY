import mongoose from "mongoose";
import { Attempt } from "../models/Attempt";

/**
 * Cleanup script to remove old or excessive violation logs to optimize database storage.
 * This can be run as a scheduled task (cron job) to keep the database lean.
 */
async function cleanupViolations() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not found in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for violation cleanup...");

    // Example 1: Remove violations older than 30 days for completed attempts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Attempt.updateMany(
      { status: { $in: ["submitted", "auto_submitted"] } },
      { 
        $pull: { 
          violations: { 
            timestamp: { $lt: thirtyDaysAgo } 
          } 
        } 
      }
    );

    console.log(`Successfully cleaned up violation logs from ${result.modifiedCount} attempts.`);

    // Example 2: Limit the number of violations stored per attempt to 50 (keep the most recent ones)
    // Note: $slice in updateMany requires MongoDB 4.2+
    /*
    await Attempt.updateMany(
      { "violations.50": { $exists: true } },
      { $push: { violations: { $each: [], $slice: -50 } } }
    );
    */

    await mongoose.disconnect();
    console.log("Cleanup complete. Disconnected from MongoDB.");
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanupViolations();
