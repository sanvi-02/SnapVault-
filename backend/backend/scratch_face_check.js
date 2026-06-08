import mongoose from "mongoose";
import dotenv from "dotenv";
import Media from "./models/Media.js";
import { extractDescriptors } from "./models/faceservice.js";

dotenv.config();

async function processAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/event-media");
    
    // Find all media where facesProcessed is not strictly true
    const unprocessed = await Media.find({ facesProcessed: { $ne: true } });
    console.log(`Found ${unprocessed.length} unindexed media items.`);
    
    let processed = 0;
    let failed = 0;

    for (const media of unprocessed) {
      try {
        console.log(`Processing media: ${media.url}`);
        const descriptors = await extractDescriptors(media.url);
        await Media.findByIdAndUpdate(media._id, {
          faceDescriptors: descriptors,
          facesProcessed: true,
        });
        console.log(` -> Found ${descriptors.length} faces.`);
        processed++;
      } catch (err) {
        console.error(` -> Failed: ${err.message}`);
        await Media.findByIdAndUpdate(media._id, {
          faceDescriptors: [],
          facesProcessed: true,
        });
        failed++;
      }
    }

    console.log(`Done! Processed: ${processed}, Failed: ${failed}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

processAll();
