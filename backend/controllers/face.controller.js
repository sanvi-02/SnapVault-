// controllers/face.controller.js — ES Module syntax
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import Media from "../models/Media.js";
import {
  extractSingleDescriptor,
  extractDescriptors,
  isMatch,
} from "../models/faceservice.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/face/register
// Upload selfie → extract face descriptor → save to User
// ─────────────────────────────────────────────────────────────────────────────
export const registerFace = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: "Selfie image required" });
    }

    // 1. Extract descriptor from the uploaded buffer (no need to upload first)
    const descriptor = await extractSingleDescriptor(req.file.buffer);
    if (!descriptor) {
      return res.status(400).json({
        message:
          "No face detected in the uploaded photo. Please use a clear, front-facing selfie with good lighting.",
      });
    }

    // 2. Delete old selfie from Cloudinary if it exists
    if (req.user.facePublicId) {
      await cloudinary.uploader.destroy(req.user.facePublicId).catch(() => { });
    }

    // 3. Upload new selfie to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "face_index",
          public_id: `user_${userId}_${Date.now()}`,
          tags: [`user_${userId}`],
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
          ],
        },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    // 3. Persist descriptor + publicId to User
    await User.findByIdAndUpdate(userId, {
      facePublicId: uploadResult.public_id,
      faceIndexed: true,
      faceDescriptor: descriptor, // 128-element array
    });

    return res.status(200).json({
      message: "Face registered successfully",
      facePublicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error("registerFace error:", error);
    return res.status(500).json({
      message: "Face registration failed",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/face/myphotos
// Compare stored user descriptor against all indexed Media documents
// ─────────────────────────────────────────────────────────────────────────────
export const findMyPhotos = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select(
      "faceIndexed faceDescriptor"
    );

    if (!user.faceIndexed || !user.faceDescriptor?.length) {
      return res.status(400).json({
        message: "Face not registered. Please upload a selfie first.",
      });
    }

    const threshold = parseFloat(req.query.threshold) || 0.55;

    // ── Only scan media that has already been face-processed ──────────────────
    // Media that hasn't been processed yet won't have descriptors, so skip it.
    // A background job (see processUnindexedMedia below) handles those.
    const allMedia = await Media.find({
      facesProcessed: true,
      faceDescriptors: { $exists: true, $not: { $size: 0 } },
    })
      .populate("uploadedBy", "name username avatar")
      .populate("eventId", "name date")
      .sort({ createdAt: -1 })
      .lean(); // lean() for performance — we're not mutating

    const matchingPhotos = [];

    for (const media of allMedia) {
      const result = isMatch(
        user.faceDescriptor,
        media.faceDescriptors,
        threshold
      );
      if (result.matched) {
        matchingPhotos.push({
          ...media,
          similarityScore: result.score,
          matchDistance: result.distance,
          eventName: media.eventId?.name || "Event",
        });
      }
    }

    // Sort best matches first
    matchingPhotos.sort((a, b) => b.similarityScore - a.similarityScore);

    // ── Also report unprocessed count so the UI can inform the user ──────────
    const unprocessedCount = await Media.countDocuments({
      facesProcessed: false,
    });

    return res.status(200).json({
      count: matchingPhotos.length,
      photos: matchingPhotos,
      unprocessedCount, // frontend can show "X photos still being indexed"
    });
  } catch (error) {
    console.error("findMyPhotos error:", error);
    return res.status(500).json({
      message: "Photo search failed",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/face/process/:mediaId
// Process a single media item — extract + store face descriptors
// Called automatically after upload (from media controller)
// ─────────────────────────────────────────────────────────────────────────────
export const processMediaFaces = async (req, res) => {
  try {
    const media = await Media.findById(req.params.mediaId);
    if (!media) return res.status(404).json({ message: "Media not found" });

    const descriptors = await extractDescriptors(media.url);

    await Media.findByIdAndUpdate(media._id, {
      faceDescriptors: descriptors,
      facesProcessed: true,
    });

    return res.status(200).json({
      message: "Faces processed",
      facesFound: descriptors.length,
    });
  } catch (error) {
    console.error("processMediaFaces error:", error);
    return res.status(500).json({
      message: "Face processing failed",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/face/reindex
// (Admin / cron) Re-process all unindexed media in batches
// ─────────────────────────────────────────────────────────────────────────────
export const reindexAllMedia = async (req, res) => {
  try {
    const unprocessed = await Media.find({ facesProcessed: false }).limit(50);
    let processed = 0;
    let failed = 0;

    for (const media of unprocessed) {
      try {
        const descriptors = await extractDescriptors(media.url);
        await Media.findByIdAndUpdate(media._id, {
          faceDescriptors: descriptors,
          facesProcessed: true,
        });
        processed++;
      } catch {
        // Mark as processed with empty descriptors so we don't retry forever
        await Media.findByIdAndUpdate(media._id, {
          faceDescriptors: [],
          facesProcessed: true,
        });
        failed++;
      }
    }

    return res.status(200).json({
      message: "Reindex complete",
      processed,
      failed,
      remaining: await Media.countDocuments({ facesProcessed: false }),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Reindex failed", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/face/status
// ─────────────────────────────────────────────────────────────────────────────
export const getFaceStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "faceIndexed facePublicId faceDescriptor"
    );
    const totalMedia = await Media.countDocuments();
    const indexedMedia = await Media.countDocuments({ facesProcessed: true });

    return res.status(200).json({
      faceIndexed: user.faceIndexed || false,
      hasDescriptor: user.faceDescriptor?.length > 0,
      selfieUrl: user.facePublicId
        ? cloudinary.url(user.facePublicId, {
          width: 150,
          height: 150,
          crop: "fill",
          gravity: "face",
        })
        : null,
      indexingProgress: {
        total: totalMedia,
        indexed: indexedMedia,
        pending: totalMedia - indexedMedia,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Status check failed", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/face/register
// ─────────────────────────────────────────────────────────────────────────────
export const deleteFace = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user?.facePublicId) {
      await cloudinary.uploader.destroy(user.facePublicId).catch(() => { }); // non-fatal
    }

    await User.findByIdAndUpdate(userId, {
      facePublicId: null,
      faceIndexed: false,
      faceDescriptor: [],
    });

    return res.status(200).json({ message: "Face registration removed" });
  } catch (error) {
    console.error("deleteFace error:", error);
    return res
      .status(500)
      .json({ message: "Face deletion failed", error: error.message });
  }
};
