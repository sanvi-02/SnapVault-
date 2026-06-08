// controllers/search.controller.js — Global Search System
import Media from "../models/Media.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Tag from "../models/Tag.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/search?q=...&type=all&page=1&limit=10&dateFrom=...&dateTo=...
// Full search with grouped results
// ─────────────────────────────────────────────────────────────────────────────
export const globalSearch = async (req, res) => {
  try {
    const {
      q = "",
      type = "all",
      page = 1,
      limit = 12,
      dateFrom,
      dateTo,
      tags: tagsParam,
    } = req.query;

    const query = q.trim();
    const tagList = tagsParam
      ? tagsParam.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    if (!query && tagList.length === 0) {
      return res.status(400).json({ message: "Search query or tags filter is required" });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build a fuzzy regex for matching (case-insensitive, partial match)
    const fuzzyRegex = query
      ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : null;

    // Date filter for media
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);

    const results = {};

    // ─── Events ─────────────────────────────────────────────────────────────
    if (type === "all" || type === "events") {
      const eventQuery = {
        $or: [
          { name: fuzzyRegex },
          { description: fuzzyRegex },
          { category: fuzzyRegex },
        ],
      };

      const [events, eventCount] = await Promise.all([
        Event.find(eventQuery)
          .populate("createdBy", "name email")
          .sort({ date: -1 })
          .skip(type === "events" ? skip : 0)
          .limit(type === "events" ? limitNum : 5),
        Event.countDocuments(eventQuery),
      ]);

      results.events = { items: events, total: eventCount };
    }

    // ─── Media (Photos / Videos) ────────────────────────────────────────────
    if (type === "all" || type === "media" || type === "photos") {
      const mediaQuery = {};
      const andConditions = [];

      if (fuzzyRegex) {
        andConditions.push({
          $or: [
            { caption: fuzzyRegex },
            { tags: fuzzyRegex },
            { "aiTags.label": fuzzyRegex },
          ],
        });
      }

      if (tagList.length > 0) {
        tagList.forEach((tag) => {
          andConditions.push({
            $or: [{ tags: tag }, { "aiTags.label": tag }],
          });
        });
      }

      if (andConditions.length === 1) {
        Object.assign(mediaQuery, andConditions[0]);
      } else if (andConditions.length > 1) {
        mediaQuery.$and = andConditions;
      }

      if (dateFrom || dateTo) {
        mediaQuery.createdAt = dateFilter;
      }

      const [media, mediaCount] = await Promise.all([
        Media.find(mediaQuery)
          .populate("uploadedBy", "name email")
          .populate("eventId", "name date")
          .sort({ createdAt: -1 })
          .skip(type !== "all" ? skip : 0)
          .limit(type !== "all" ? limitNum : 8),
        Media.countDocuments(mediaQuery),
      ]);

      results.media = { items: media, total: mediaCount };
    }

    // ─── Tags ───────────────────────────────────────────────────────────────
    if (type === "all" || type === "tags") {
      const tagQuery = { name: fuzzyRegex };
      const [tags, tagCount] = await Promise.all([
        Tag.find(tagQuery)
          .sort({ mediaCount: -1 })
          .skip(type === "tags" ? skip : 0)
          .limit(type === "tags" ? limitNum : 10),
        Tag.countDocuments(tagQuery),
      ]);

      results.tags = { items: tags, total: tagCount };
    }

    // ─── Photographers ──────────────────────────────────────────────────────
    if (type === "all" || type === "photographers") {
      const photographerQuery = {
        name: fuzzyRegex,
        role: { $in: ["Photographer", "Admin"] },
      };
      const [photographers, photographerCount] = await Promise.all([
        User.find(photographerQuery)
          .select("name email role profilePic")
          .skip(type === "photographers" ? skip : 0)
          .limit(type === "photographers" ? limitNum : 5),
        User.countDocuments(photographerQuery),
      ]);

      results.photographers = {
        items: photographers,
        total: photographerCount,
      };
    }

    return res.json({
      query,
      type,
      page: pageNum,
      limit: limitNum,
      results,
    });
  } catch (err) {
    console.error("globalSearch error:", err);
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/search/suggestions?q=...
// Quick debounced suggestions (top 3 per category)
// ─────────────────────────────────────────────────────────────────────────────
export const searchSuggestions = async (req, res) => {
  try {
    const { q = "" } = req.query;
    const query = q.trim();

    if (query.length < 2) {
      return res.json({ events: [], media: [], tags: [], photographers: [] });
    }

    const fuzzyRegex = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    const [events, media, tags, photographers] = await Promise.all([
      Event.find({ $or: [{ name: fuzzyRegex }, { category: fuzzyRegex }] })
        .select("name category date")
        .sort({ date: -1 })
        .limit(3),

      Media.find({
        $or: [
          { caption: fuzzyRegex },
          { tags: fuzzyRegex },
          { "aiTags.label": fuzzyRegex },
        ],
      })
        .select("url caption tags eventId")
        .populate("eventId", "name")
        .sort({ createdAt: -1 })
        .limit(4),

      Tag.find({ name: fuzzyRegex })
        .select("name slug mediaCount")
        .sort({ mediaCount: -1 })
        .limit(5),

      User.find({
        name: fuzzyRegex,
        role: { $in: ["Photographer", "Admin"] },
      })
        .select("name role profilePic")
        .limit(3),
    ]);

    return res.json({ events, media, tags, photographers });
  } catch (err) {
    console.error("searchSuggestions error:", err);
    res.status(500).json({ message: "Suggestions failed" });
  }
};
