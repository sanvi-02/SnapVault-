// models/Media.js — ES Module syntax
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String }, // exact Cloudinary public_id
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [{ type: String }],
    aiTags: [{ label: String, score: Number }],
    caption: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    downloadCount: { type: Number, default: 0 },

    // ─── Face Recognition ────────────────────────────────────────────────────
    // Array of face descriptors found in this image.
    // Each descriptor is a 128-element Float32Array serialised as a plain number[].
    faceDescriptors: {
      type: [[Number]], // Array of arrays — one inner array per detected face
      default: [],
    },
    facesProcessed: { type: Boolean, default: false },
    aiTagsProcessed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

mediaSchema.index({ tags: 1 });
mediaSchema.index({ "aiTags.label": 1 });
mediaSchema.index({ aiTagsProcessed: 1 });

// Index for fast face-search queries
mediaSchema.index({ facesProcessed: 1 });
mediaSchema.index({ eventId: 1, facesProcessed: 1 });

const Media = mongoose.model("Media", mediaSchema);
export default Media;
