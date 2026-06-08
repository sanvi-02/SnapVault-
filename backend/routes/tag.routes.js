// routes/tag.routes.js — Complete Tag Routes
import express from "express";
import {
  getAllTags,
  getTagBySlug,
  createTag,
  updateTag,
  deleteTag,
  autocomplete,
  getTagStats,
} from "../controllers/tag.controller.js";
import { protect} from "../middleware/auth.middleware.js"; // Adjust path as needed

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES (No auth required)
// ─────────────────────────────────────────────────────────────────────────────

// Get all tags with pagination and search
// GET /api/tags?page=1&limit=30&q=photography
router.get("/", getAllTags);

// GET /api/tags/search/autocomplete?q=phot
router.get("/search/autocomplete", autocomplete);

// GET /api/tags/stats/overview
router.get("/stats/overview", protect, getTagStats);

// Get tag by slug with related tags
// GET /api/tags/nature?page=1&limit=20
router.get("/:slug", getTagBySlug);

router.post("/", protect, createTag);

router.patch("/:id", protect, updateTag);

router.delete("/:id", protect, deleteTag);

export default router;
