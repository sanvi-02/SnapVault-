import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const MediaSchema = new mongoose.Schema({
  url: String,
  publicId: String,
});
const Media = mongoose.model("Media", MediaSchema, "media");

async function check() {
  const media = await Media.find();
  console.log(media);
  process.exit(0);
}
check();
