// controllers/download.controller.js — Watermark Download System
import Media from "../models/Media.js";
import { applyWatermark } from "../services/watermark.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/download/:id
// Fetch image from Cloudinary, apply watermark, stream to client
// ─────────────────────────────────────────────────────────────────────────────
export const downloadWithWatermark = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate("eventId", "name")
      .populate("uploadedBy", "name");

    if (!media) {
      return res.status(404).json({ message: "Media not found" });
    }

    // Fetch original image from Cloudinary
    const imageResponse = await fetch(media.url);
    if (!imageResponse.ok) {
      return res
        .status(502)
        .json({ message: "Failed to fetch original image from storage" });
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Determine output format
    const isNg = media.url.toLowerCase().includes(".png");
    const format = isNg ? "png" : "jpeg";
    const ext = isNg ? "png" : "jpg";
    const mimeType = isNg ? "image/png" : "image/jpeg";

    // Build timestamp
    const now = new Date();
    const timestamp = now.toLocaleString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Apply watermark
    const watermarkedBuffer = await applyWatermark({
      imageBuffer,
      clubName: process.env.CLUB_NAME || "SnapVault",
      eventName: media.eventId?.name || "Event",
      userName: req.user?.name || "User",
      timestamp,
      format,
    });

    // Increment download count
    await Media.findByIdAndUpdate(media._id, {
      $inc: { downloadCount: 1 },
      $set: { lastDownloadedAt: now },
    });

    // Build filename
    const safeEventName = (media.eventId?.name || "photo")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const filename = `${safeEventName}_${media._id}.${ext}`;

    // Stream to client
    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": watermarkedBuffer.length,
      "Cache-Control": "no-store",
    });

    return res.send(watermarkedBuffer);
  } catch (err) {
    console.error("downloadWithWatermark error:", err);
    res.status(500).json({ message: "Download failed", error: err.message });
  }
};
