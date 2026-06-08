import { getAllFaceDescriptors } from "./utils/faceRecognition.js";

async function test() {
  try {
    const descriptors = await getAllFaceDescriptors("https://res.cloudinary.com/demo/image/upload/sample.jpg");
    console.log("Descriptors count:", descriptors.length);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
