// routes/face.routes.js — ES Module syntax
import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import {
  registerFace,
  findMyPhotos,
  getFaceStatus,
  deleteFace,
  processMediaFaces,
  reindexAllMedia,
} from "../controllers/face.controller.js";

const router = express.Router();

// Memory storage for selfie — we only need the buffer for descriptor extraction
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP allowed"), false);
  },
});

router.use(protect);

router.post("/register", upload.single("selfie"), registerFace);
router.get("/myphotos", findMyPhotos);
router.get("/status", getFaceStatus);
router.delete("/register", deleteFace);
router.post("/process/:mediaId", processMediaFaces);
router.post("/reindex", reindexAllMedia); // admin only

export default router;
