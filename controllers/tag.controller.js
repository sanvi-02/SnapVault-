// controllers/tag.controller.js — Complete Tag Management
import Tag from "../models/Tag.js";
import Media from "../models/Media.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tags?page=1&limit=30&q=...
// List all tags sorted by media count (trending first), with optional search
// ─────────────────────────────────────────────────────────────────────────────
export const getAllTags = async (req, res) => {
  try {
    const { page = 1, limit = 30, q = "" } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build search filter
    const filter = {};
    if (q.trim()) {
      filter.name = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
    }

    // Fetch paginated tags (all tags, sorted by popularity)
    const [tags, total] = await Promise.all([
      Tag.find(filter)
        .sort({ mediaCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Tag.countDocuments(filter),
    ]);

    // Fetch trending tags (top 20, regardless of search)
    // Removed the $gt: 0 filter to show even tags with 0 media
    const trending = await Tag.find()
      .sort({ mediaCount: -1, createdAt: -1 })
      .limit(20);

    return res.json({
      tags,
      trending: trending.length > 0 ? trending : [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("getAllTags error:", err);
    res.status(500).json({ message: "Failed to fetch tags" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tags/:slug
// Tag detail page — returns tag info + media that have this tag
// ─────────────────────────────────────────────────────────────────────────────
export const getTagBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Find the tag document
    const tag = await Tag.findOne({ slug: slug.toLowerCase() });
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    // Find media that have this tag (either in manual tags or AI tags)
    const tagRegex = new RegExp(`^${tag.name}$`, "i");
    const mediaFilter = {
      $or: [{ tags: tagRegex }, { "aiTags.label": tagRegex }],
    };

    const [media, total] = await Promise.all([
      Media.find(mediaFilter)
        .populate("uploadedBy", "name email")
        .populate("eventId", "name date")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Media.countDocuments(mediaFilter),
    ]);

    // Find related tags (other tags that appear on the same media)
    const mediaIds = media.map((m) => m._id);
    let relatedTags = [];

    if (mediaIds.length > 0) {
      const relatedMediaDocs = await Media.find({
        _id: { $in: mediaIds },
      }).select("tags aiTags");

      const relatedTagNames = new Set();
      relatedMediaDocs.forEach((m) => {
        m.tags.forEach((t) => relatedTagNames.add(t.toLowerCase()));
        m.aiTags.forEach((t) => relatedTagNames.add(t.label.toLowerCase()));
      });
      relatedTagNames.delete(tag.name.toLowerCase()); // remove self

      relatedTags = await Tag.find({
        name: {
          $in: Array.from(relatedTagNames).map(
            (t) => new RegExp(`^${t}$`, "i")
          ),
        },
      })
        .sort({ mediaCount: -1 })
        .limit(15);
    }

    return res.json({
      tag,
      media,
      relatedTags,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("getTagBySlug error:", err);
    res.status(500).json({ message: "Failed to fetch tag detail" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tags
// Create a new tag (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const createTag = async (req, res) => {
  try {
    const { name, source = "manual", description = "" } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tag name is required" });
    }

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      return res.status(409).json({ message: "Tag already exists" });
    }

    // Create slug automatically
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newTag = new Tag({
      name: name.trim(),
      slug,
      source,
      description,
      mediaCount: 0,
    });

    await newTag.save();

    res.status(201).json({
      message: "Tag created successfully",
      tag: newTag,
    });
  } catch (err) {
    console.error("createTag error:", err);
    res.status(500).json({ message: "Failed to create tag" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tags/:id
// Update a tag (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, source } = req.body;

    const tag = await Tag.findById(id);
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    // Update fields if provided
    if (name) {
      tag.name = name.trim();
      tag.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) tag.description = description;
    if (source) tag.source = source;

    await tag.save();

    res.json({
      message: "Tag updated successfully",
      tag,
    });
  } catch (err) {
    console.error("updateTag error:", err);
    res.status(500).json({ message: "Failed to update tag" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tags/:id
// Delete a tag (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    res.json({
      message: "Tag deleted successfully",
      tag,
    });
  } catch (err) {
    console.error("deleteTag error:", err);
    res.status(500).json({ message: "Failed to delete tag" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tags/increment/:tagName
// Increment media count for a tag (called when media is tagged)
// ─────────────────────────────────────────────────────────────────────────────
export const incrementTagCount = async (tagName, source = "manual") => {
  try {
    const slug = tagName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const tag = await Tag.findOneAndUpdate(
      { name: tagName.toLowerCase() },
      {
        $inc: { mediaCount: 1 },
        source: source === "ai" ? "ai" : "manual",
      },
      { upsert: true, new: true }
    );

    return tag;
  } catch (err) {
    console.error("incrementTagCount error:", err);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tags/decrement/:tagName
// Decrement media count for a tag (called when media is untagged)
// ─────────────────────────────────────────────────────────────────────────────
export const decrementTagCount = async (tagName) => {
  try {
    const tag = await Tag.findOneAndUpdate(
      { name: tagName.toLowerCase() },
      { $inc: { mediaCount: -1 } },
      { new: true }
    );

    // Delete tag if count reaches 0 (optional)
    if (tag && tag.mediaCount <= 0) {
      await Tag.deleteOne({ _id: tag._id });
    }

    return tag;
  } catch (err) {
    console.error("decrementTagCount error:", err);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tags/search/autocomplete?q=...
// Quick autocomplete endpoint for tag search
// ─────────────────────────────────────────────────────────────────────────────
export const autocomplete = async (req, res) => {
  try {
    const { q = "" } = req.query;

    if (!q.trim() || q.trim().length < 1) {
      return res.json([]);
    }

    const tags = await Tag.find({
      name: new RegExp(`^${q.trim()}`, "i"),
    })
      .sort({ mediaCount: -1 })
      .limit(10)
      .select("name slug mediaCount");

    return res.json(tags);
  } catch (err) {
    console.error("autocomplete error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch autocomplete suggestions" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tags/stats/overview
// Get tag statistics (admin dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export const getTagStats = async (req, res) => {
  try {
    const totalTags = await Tag.countDocuments();
    const aiTags = await Tag.countDocuments({ source: "ai" });
    const manualTags = await Tag.countDocuments({ source: "manual" });
    const bothTags = await Tag.countDocuments({ source: "both" });

    const topTags = await Tag.find()
      .sort({ mediaCount: -1 })
      .limit(10)
      .select("name mediaCount");

    const totalMedia = await Tag.aggregate([
      { $group: { _id: null, total: { $sum: "$mediaCount" } } },
    ]);

    res.json({
      totalTags,
      bySource: {
        ai: aiTags,
        manual: manualTags,
        both: bothTags,
      },
      topTags,
      totalMediaTagged: totalMedia[0]?.total || 0,
    });
  } catch (err) {
    console.error("getTagStats error:", err);
    res.status(500).json({ message: "Failed to fetch tag statistics" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper function: Update tag source after counting
// Call this when both AI and manual tags exist for same tag
// ─────────────────────────────────────────────────────────────────────────────
export const updateTagSource = async (tagName) => {
  try {
    const tagRegex = new RegExp(`^${tagName}$`, "i");

    // Check if tag appears in both manual and AI tags
    const mediaWithManual = await Media.countDocuments({ tags: tagRegex });
    const mediaWithAI = await Media.countDocuments({
      "aiTags.label": tagRegex,
    });

    let source = "manual";
    if (mediaWithManual > 0 && mediaWithAI > 0) {
      source = "both";
    } else if (mediaWithAI > 0) {
      source = "ai";
    }

    await Tag.findOneAndUpdate(
      { name: tagName.toLowerCase() },
      { source },
      { new: true }
    );
  } catch (err) {
    console.error("updateTagSource error:", err);
  }
};
