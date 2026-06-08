import { v2 as cloudinary } from "cloudinary";
cloudinary.config({
  cloud_name: "dt5tpx4im",
  api_key: "216131566817789",
  api_secret: "mPhKd5F4c1dZinNB-vEwbRfRAu8",
});
async function test() {
  try {
    const res = await cloudinary.uploader.upload("https://res.cloudinary.com/dt5tpx4im/image/upload/v1/snapvault/sample.jpg", {
      similarity_search: {
        input_public_id: "some_id",
        min_score: 0.7,
      }
    });
    console.log(res);
  } catch (err) {
    console.error(err);
  }
}
test();
