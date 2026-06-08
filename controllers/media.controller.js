// controllers/media.controller.js — ES Module syntax
import { v2 as cloudinary } from "cloudinary";
import Media from "../models/Media.js";
import { extractDescriptors } from "../models/faceservice.js";
import { processMediaTags, syncManualTags } from "../services/tagging.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: reliable publicId from stored field OR fallback URL parse
// ─────────────────────────────────────────────────────────────────────────────
function getPublicId(media) {
  if (media.publicId) return media.publicId; // stored directly — always prefer this

  // Fallback: parse from Cloudinary URL
  // e.g. https://res.cloudinary.com/demo/image/upload/v123/snapvault/abc.jpg
  //   →  snapvault/abc
  try {
    const afterUpload = media.url.split("/upload/")[1]; // "v123/snapvault/abc.jpg"
    const withoutVersion = afterUpload.replace(/^v\d+\//, ""); // "snapvault/abc.jpg"
    return withoutVersion.replace(/\.[^/.]+$/, ""); // "snapvault/abc"
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: fire-and-forget face processing after upload
// ─────────────────────────────────────────────────────────────────────────────
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
    // Mark processed with empty array so it never blocks future searches
    await Media.findByIdAndUpdate(mediaId, {
      faceDescriptors: [],
      facesProcessed: true,
    }).catch(() => { });
    console.error(
      `❌ Face processing failed for media ${mediaId}:`,
      err.message
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/media/upload  (single)
// ─────────────────────────────────────────────────────────────────────────────
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!req.body.eventId)
      return res.status(400).json({ message: "eventId is required" });

    const parsedTags = req.body.tags ? JSON.parse(req.body.tags) : [];

    const media = await Media.create({
      url: req.file.path, // Cloudinary secure_url
      publicId: req.file.filename, // ← store directly (multer-storage-cloudinary sets this)
      eventId: req.body.eventId,
      uploadedBy: req.user._id || req.user.id, // handle both middleware variants
      caption: req.body.caption || "",
      tags: parsedTags,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      facesProcessed: false,
      aiTagsProcessed: false,
    });

    // Kick off face indexing asynchronously — don't block the HTTP response
    triggerFaceProcessing(media._id, media.url);

    // Kick off AI tagging asynchronously
    processMediaTags(media._id, media.url);

    // Sync manual tags into Tag collection
    if (parsedTags.length > 0) {
      syncManualTags(parsedTags);
    }

    res.status(201).json(media);
  } catch (err) {
    console.error("uploadMedia error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/media/bulk-upload
// ─────────────────────────────────────────────────────────────────────────────
export const bulkUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No files uploaded" });
    if (!req.body.eventId)
      return res.status(400).json({ message: "eventId is required" });

    const mediaList = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename, // ← store directly
      eventId: req.body.eventId,
      uploadedBy: req.user._id || req.user.id,
      caption: "",
      tags: [],
      fileName: file.originalname,
      fileType: file.mimetype,
      facesProcessed: false,
      aiTagsProcessed: false,
    }));

    const saved = await Media.insertMany(mediaList);

    // Process faces and AI tags for every uploaded file asynchronously
    saved.forEach((m) => {
      triggerFaceProcessing(m._id, m.url);
      processMediaTags(m._id, m.url);
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("bulkUpload error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/media/event/:eventId
// ─────────────────────────────────────────────────────────────────────────────
export const getMediaByEvent = async (req, res) => {
  try {
    const media = await Media.find({ eventId: req.params.eventId })
      .populate("uploadedBy", "name email avatar")
      .sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/media/:id
// Update caption, tags, or replace the image file
// ─────────────────────────────────────────────────────────────────────────────
export const updateMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: "Media not found" });

    // Only the uploader can edit
    const uploaderId = media.uploadedBy.toString();
    const requesterId = (req.user._id || req.user.id).toString();
    if (uploaderId !== requesterId) {
      return res
        .status(403)
        .json({ message: "Not authorised to edit this media" });
    }

    const updates = {};

    // ── Text fields ─────────────────────────────────────────────────────────
    if (req.body.caption !== undefined) {
      updates.caption = req.body.caption.trim();
    }
    if (req.body.tags !== undefined) {
      updates.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : JSON.parse(req.body.tags);

      // Sync manual tags
      syncManualTags(updates.tags);
    }

    // ── File replacement ────────────────────────────────────────────────────
    if (req.file) {
      // Delete old image from Cloudinary first
      const oldPublicId = getPublicId(media);
      if (oldPublicId) {
        await cloudinary.uploader
          .destroy(oldPublicId)
          .catch((e) =>
            console.warn("Old Cloudinary image delete failed:", e.message)
          );
      }

      updates.url = req.file.path;
      updates.publicId = req.file.filename;
      updates.fileName = req.file.originalname;
      updates.fileType = req.file.mimetype;

      // Must re-process faces and AI tags for the new image
      updates.facesProcessed = false;
      updates.faceDescriptors = [];
      updates.aiTagsProcessed = false;
      updates.aiTags = [];
    }

    const updated = await Media.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("uploadedBy", "name email avatar");

    // Re-index faces and AI tags if image was replaced
    if (req.file) {
      triggerFaceProcessing(updated._id, updated.url);
      processMediaTags(updated._id, updated.url);
    }

    return res.status(200).json({
      message: "Media updated successfully",
      media: updated,
    });
  } catch (err) {
    console.error("updateMedia error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/media/:id
// ─────────────────────────────────────────────────────────────────────────────
export const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ message: "Media not found" });

    // Authorization check
    const uploaderId = media.uploadedBy.toString();
    const requesterId = (req.user._id || req.user.id).toString();
    if (uploaderId !== requesterId) {
      return res
        .status(403)
        .json({ message: "Not authorised to delete this media" });
    }

    // Delete from Cloudinary using the reliable publicId
    const publicId = getPublicId(media);
    if (publicId) {
      await cloudinary.uploader
        .destroy(publicId)
        .catch((e) => console.warn("Cloudinary delete failed:", e.message));
    }

    await media.deleteOne();
    res.json({ message: "Media deleted successfully" });
  } catch (err) {
    console.error("deleteMedia error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/media/:id/download  (legacy — returns download URL)
// ─────────────────────────────────────────────────────────────────────────────
export const downloadMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate("eventId", "name")
      .populate("uploadedBy", "name role");

    if (!media) return res.status(404).json({ message: "Media not found" });

    // Generate a Cloudinary download URL with attachment flag
    const publicId = getPublicId(media);
    const downloadUrl = publicId
      ? cloudinary.url(publicId, {
        flags: "attachment",
        resource_type: "image",
      })
      : media.url;

    res.json({ url: downloadUrl, media });
  } catch (err) {
    console.error("downloadMedia error:", err);
    res.status(500).json({ message: err.message });
  }
};
