// routes/download.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { downloadWithWatermark } from "../controllers/download.controller.js";

const router = express.Router();

router.get("/:id", protect, downloadWithWatermark);

export default router;
