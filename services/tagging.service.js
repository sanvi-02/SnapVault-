// AI Tag Processing Pipeline
import Media from "../models/Media.js";
import Tag from "../models/Tag.js";
import { analyzeImage, isVisionConfigured, getProviderName } from "./vision/index.js";

const MIN_TAGS = 5;
const MAX_TAGS = 15;

function normalizeTagName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function dedupeLabels(labels) {
  const seen = new Set();
  const result = [];
  for (const item of labels) {
    const label = normalizeTagName(item.label);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    result.push({
      label,
      score: item.score ?? item.confidence ?? 0.5,
    });
    if (result.length >= MAX_TAGS) break;
  }
  return result;
}

export async function processMediaTags(mediaId, imageUrl) {
  try {
    const provider = getProviderName();
    console.log(`🏷️  Analyzing media ${mediaId} via ${provider}...`);

    let labels = [];
    if (isVisionConfigured()) {
      labels = await analyzeImage(imageUrl);
      console.log("RAW LABELS:", labels);
    }

    labels = dedupeLabels(labels);

    if (labels.length < MIN_TAGS && labels.length > 0) {
      // Pad with generic tags if provider returned too few
      const fillers = ["event", "photo", "memories", "celebration", "community"];
      for (const f of fillers) {
        if (labels.length >= MIN_TAGS) break;
        if (!labels.some((l) => l.label === f)) {
          labels.push({ label: f, score: 0.5 });
        }
      }
    }

    await Promise.allSettled(
      labels.map((l) => Tag.upsertTag(l.label, "ai"))
    );

    await Media.findByIdAndUpdate(mediaId, {
      aiTags: labels,
      aiTagsProcessed: true,
    });

    console.log(
      `✅ AI tags for media ${mediaId}: ${labels.length} — [${labels.map((l) => l.label).join(", ")}]`
    );

    return labels;
  } catch (err) {
    await Media.findByIdAndUpdate(mediaId, {
      aiTags: [],
      aiTagsProcessed: true,
    }).catch(() => {});
    console.error(`❌ AI tagging failed for media ${mediaId}:`, err.message);
    return [];
  }
}

export async function syncManualTags(tagNames) {
  if (!tagNames || tagNames.length === 0) return;
  try {
    const unique = [...new Set(tagNames.map(normalizeTagName).filter(Boolean))];
    await Promise.allSettled(
      unique.map((name) => Tag.upsertTag(name, "manual"))
    );
  } catch (err) {
    console.error("❌ Manual tag sync failed:", err.message);
  }
}

export async function updateMediaTagsAdmin(mediaId, { tags, aiTags }) {
  const media = await Media.findById(mediaId);
  if (!media) throw new Error("Media not found");

  const updates = {};

  if (tags !== undefined) {
    updates.tags = [...new Set(tags.map(normalizeTagName).filter(Boolean))];
    await syncManualTags(updates.tags);
  }

  if (aiTags !== undefined) {
    updates.aiTags = dedupeLabels(
      aiTags.map((t) =>
        typeof t === "string" ? { label: t, score: 0.8 } : t
      )
    );
    await Promise.allSettled(
      updates.aiTags.map((l) => Tag.upsertTag(l.label, "ai"))
    );
  }

  return Media.findByIdAndUpdate(mediaId, updates, { new: true });
}
