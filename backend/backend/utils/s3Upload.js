// utils/s3Upload.js — ES Module syntax
// (Currently uses Cloudinary — name kept for backward compatibility)
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "event-media",
    allowed_formats: ["jpg", "jpeg", "png", "mp4", "mov"],
    resource_type: "auto",
  },
});

const upload = multer({ storage });

export default upload;
