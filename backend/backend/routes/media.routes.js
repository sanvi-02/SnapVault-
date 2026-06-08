// routes/media.routes.js — ES Module syntax
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import express from "express";
import Media from "../models/Media.js";
import { protect } from "../middleware/auth.middleware.js";
import { extractDescriptors } from "../models/faceservice.js";
import {
  processMediaTags,
  syncManualTags,
  updateMediaTagsAdmin,
} from "../services/tagging.service.js";

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dt5tpx4im",
  api_key: process.env.CLOUDINARY_API_KEY || "216131566817789",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "mPhKd5F4c1dZinNB-vEwbRfRAu8",
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "snapvault",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

// ─── Fire-and-forget face processing ────────────────────────────────────────
async function triggerFaceProcessing(mediaId, url) {
  try {
    const descriptors = await extractDescriptors(url);
    await Media.findByIdAndUpdate(mediaId, {
      faceDescriptors: descriptors,
      facesProcessed: true,
    });
    console.log(
      `✅ Faces processed for media ${mediaId}: ${descriptors.length} face(s) found`
    );
  } catch (err) {
    await Media.findByIdAndUpdate(mediaId, {
      faceDescriptors: [],
      facesProcessed: true,
    }).catch(() => {});
    console.error(
      `❌ Face processing failed for media ${mediaId}:`,
      err.message
    );
  }
}

// Helper: is user admin or club member?
const canSeePrivate = (user) =>
  user &&
  (user.role === "Admin" ||
    user.role === "ClubMember" ||
    user.role === "Photographer");

// ─── POST /api/media/upload ─────────────────────────────────────────────────
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    console.log("📁 File:", req.file);
    console.log("📦 Body:", req.body);

    if (!req.file) return res.status(400).json({ message: "No file received" });

    const eventId = req.body.eventId;
    const tags = req.body.tags;
    const requestedVisibility = req.body.visibility || "public";

    console.log("🎯 eventId:", eventId);

    if (!eventId) return res.status(400).json({ message: "eventId missing" });

    // Permission check for private uploads
    if (requestedVisibility === "private" && !canSeePrivate(req.user)) {
      return res
        .status(403)
        .json({
          message: "Only Club Members and Admins can upload private media.",
        });
    }

    // Enforce valid values
    const visibility = ["public", "private"].includes(requestedVisibility)
      ? requestedVisibility
      : "public";

    const parsedTags = tags ? JSON.parse(tags) : [];

    const media = await Media.create({
      url: req.file.path,
      publicId: req.file.filename,
      eventId: eventId,
      uploadedBy: req.user._id,
      tags: parsedTags,
      visibility,
      facesProcessed: false,
      aiTagsProcessed: false,
    });

    // Kick off async processing pipelines (fire-and-forget)
    triggerFaceProcessing(media._id, media.url);
    processMediaTags(media._id, media.url);

    // Sync manual tags into Tag collection
    if (parsedTags.length > 0) {
      syncManualTags(parsedTags);
    }

    res.status(201).json(media);
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/media/all — paginated feed of all accessible media ─────────────
router.get("/all", protect, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Build visibility filter
    const visibilityFilter = canSeePrivate(req.user)
      ? {} // Can see everything
      : { $or: [{ visibility: "public" }, { visibility: { $exists: false } }] };

    const [items, total] = await Promise.all([
      Media.find(visibilityFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("uploadedBy", "name")
        .populate("comments.user", "name"),
      Media.countDocuments(visibilityFilter),
    ]);

    res.json({
      items,
      total,
      page,
      limit,
      hasMore: skip + items.length < total,
    });
  } catch (err) {
    console.error("❌ Feed error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/media/my — current user's uploads ─────────────────────────────
router.get("/my", protect, async (req, res) => {
  try {
    const media = await Media.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name")
      .populate("comments.user", "name");
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/media/:id/tag-status — poll AI tagging progress ───────────────
router.get("/:id/tag-status", protect, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).select(
      "tags aiTags aiTagsProcessed url uploadedBy"
    );
    if (!media) return res.status(404).json({ message: "Media not found" });

    res.json({
      id: media._id,
      tags: media.tags,
      aiTags: media.aiTags,
      aiTagsProcessed: media.aiTagsProcessed,
      allTags: [
        ...new Set([
          ...(media.tags || []),
          ...(media.aiTags || []).map((t) => t.label),
        ]),
      ],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── PATCH /api/media/:id/tags — admin/uploader edit tags ───────────────────
router.patch("/:id/tags", protect, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: "Media not found" });

    const isOwner = media.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to edit tags" });
    }

    const updated = await updateMediaTagsAdmin(req.params.id, {
      tags: req.body.tags,
      aiTags: req.body.aiTags,
    });

    res.json({
      message: "Tags updated",
      media: updated,
      allTags: [
        ...new Set([
          ...(updated.tags || []),
          ...(updated.aiTags || []).map((t) => t.label),
        ]),
      ],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/media/event/:eventId ──────────────────────────────────────────
router.get("/event/:eventId", protect, async (req, res) => {
  try {
    // Build visibility filter based on role
    const visibilityFilter = canSeePrivate(req.user)
      ? { eventId: req.params.eventId }
      : {
          eventId: req.params.eventId,
          $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
        };

    const media = await Media.find(visibilityFilter)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name")
      .populate("comments.user", "name");
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DELETE /api/media/:id — Delete photo by owner or admin ──────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Check authorization: Sirf uploader ya Admin delete kar sakta hai
    const isOwner = media.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this media" });
    }

    // 1. Cloudinary se photo delete karein (using publicId)
    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId);
    }

    // 2. Database se document delete karein
    await media.deleteOne();

    res.json({ message: "Media deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

export default router;
