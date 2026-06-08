import express from "express";
import {
  toggleLike,
  addComment,
  deleteComment,
  getMediaDetail,
  getNotifications,
  markAllRead,
} from "../controllers/social.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Media interactions
router.get("/media/:mediaId", protect, getMediaDetail);
router.post("/media/:mediaId/like", protect, toggleLike);
router.post("/media/:mediaId/comment", protect, addComment);
router.delete("/media/:mediaId/comment/:commentId", protect, deleteComment);

// Notifications
router.get("/notifications", protect, getNotifications);
router.patch("/notifications/read-all", protect, markAllRead);

export default router;
