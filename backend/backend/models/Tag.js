// models/Tag.js — Complete Tag Schema
import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["ai", "manual", "both"],
      default: "manual",
      description:
        "ai = from AI extraction, manual = user-added, both = both sources",
    },
    mediaCount: {
      type: Number,
      default: 0,
      index: true, // For sorting by popularity
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    color: {
      type: String,
      default: "#7c3aed", // Default purple
      match: /^#[0-9A-F]{6}$/i,
    },
    icon: {
      type: String,
      default: "🏷️",
    },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// INDEXES FOR PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────────
tagSchema.index({ name: 1 });
tagSchema.index({ slug: 1 });
tagSchema.index({ mediaCount: -1 }); // For trending queries
tagSchema.index({ source: 1 }); // For filtering by source
tagSchema.index({ createdAt: -1 }); // For sorting by date

// ─────────────────────────────────────────────────────────────────────────────
// PRE-SAVE MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────
tagSchema.pre("validate", function () {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  if (this.name) {
    this.name = this.name.toLowerCase().trim();
  }
});

tagSchema.pre("save", async function () {
  if (!this.isModified("slug")) return;

  const existing = await mongoose.model("Tag").findOne({
    slug: this.slug,
    _id: { $ne: this._id },
  });

  if (existing) {
    throw new Error(`Slug "${this.slug}" already exists`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// INSTANCE METHODS
// ─────────────────────────────────────────────────────────────────────────────
tagSchema.methods.toJSON = function () {
  const obj = this.toObject();
  // Remove unnecessary fields for API response
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC METHODS
// ─────────────────────────────────────────────────────────────────────────────
tagSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

tagSchema.statics.getTrending = function (limit = 20) {
  return this.find().sort({ mediaCount: -1, createdAt: -1 }).limit(limit);
};

tagSchema.statics.search = function (query) {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  return this.find({ name: regex }).sort({ mediaCount: -1 });
};

tagSchema.statics.upsertTag = async function (name, source = "manual") {
  const normalized = name.toLowerCase().trim().replace(/\s+/g, " ");
  if (!normalized) return null;

  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  let tag = await this.findOne({ name: normalized });

  if (tag) {
    tag.mediaCount += 1;
    if (source === "ai" && tag.source === "manual") tag.source = "both";
    else if (source === "manual" && tag.source === "ai") tag.source = "both";
    else if (tag.source !== "both") tag.source = source;
    await tag.save();
    return tag;
  }

  return this.create({
    name: normalized,
    slug,
    source,
    mediaCount: 1,
  });
};

const Tag = mongoose.model("Tag", tagSchema);

export default Tag;
