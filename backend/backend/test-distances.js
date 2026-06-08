import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Media from "./models/Media.js";
dotenv.config();

const calculateDistance = (desc1, desc2) => {
  if (!desc1 || !desc2 || desc1.length !== 128 || desc2.length !== 128) return 1.0;
  let distance = 0;
  for (let i = 0; i < 128; i++) {
    distance += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(distance);
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({ faceIndexed: true });
  if (users.length === 0) { console.log("No indexed users"); process.exit(0); }
  const user = users[users.length - 1]; // latest user
  
  if (!user.faceDescriptor || user.faceDescriptor.length !== 128) {
    console.log("User faceDescriptor missing or invalid length");
    process.exit(0);
  }
  
  const media = await Media.find({ faceDescriptors: { $exists: true, $not: { $size: 0 } } });
  
  console.log(`User: ${user.email}, Media count with descriptors: ${media.length}`);
  
  for (const m of media) {
    console.log(`Media ${m._id}:`);
    for (const desc of m.faceDescriptors) {
      console.log(`  Distance: ${calculateDistance(user.faceDescriptor, desc)}`);
    }
  }
  process.exit(0);
});
