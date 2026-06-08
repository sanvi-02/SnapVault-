import fs from "fs";
import fetch from "node-fetch";
import Media from "../models/Media.js";
import Tag from "../models/Tag.js";

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const MIN_TAGS = 5;
const MAX_TAGS = 15;

const MODELS = {
  classification: "google/vit-base-patch16-224",
  captioning: "Salesforce/blip-image-captioning-base",
};

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
    result.push({ label, score: +(item.score ?? 0.5).toFixed(2) });
    if (result.length >= MAX_TAGS) break;
  }
  return result;
}

function extractTagsFromCaption(caption) {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "is",
    "are",
    "in",
    "on",
    "at",
    "of",
    "with",
    "and",
    "or",
    "there",
    "this",
    "that",
    "it",
    "its",
    "very",
    "some",
    "has",
    "have",
    "been",
    "being",
    "was",
    "were",
    "be",
    "to",
    "for",
    "from",
    "by",
    "as",
    "into",
    "image",
    "photo",
    "picture",
    "shows",
    "show",
    "showing",
    "two",
    "three",
    "four",
    "five",
  ]);
  return caption
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .map((label) => ({ label, score: 0.65 }));
}

// ✅ Cloudinary URL aur local path dono handle karta hai
async function getImageBuffer(filePathOrUrl) {
  if (
    filePathOrUrl.startsWith("http://") ||
    filePathOrUrl.startsWith("https://")
  ) {
    const res = await fetch(filePathOrUrl);
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } else {
    return fs.readFileSync(filePathOrUrl);
  }
}

async function queryHuggingFace(modelId, imageBuffer, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/octet-stream",
          },
          body: imageBuffer,
        }
      );

      if (res.status === 503) {
        const json = await res.json();
        const waitTime = (json.estimated_time ?? 20) * 1000;
        console.log(
          `⏳ Model load ho raha hai, ${Math.round(waitTime / 1000)}s wait...`
        );
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }

      if (!res.ok)
        throw new Error(`HF API Error: ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`⚠️  Attempt ${attempt} failed, retry kar raha hoon...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

export async function processMediaTags(mediaId, filePathOrUrl) {
  try {
    console.log(`🏷️  Analyzing media ${mediaId} via Hugging Face (Free)...`);

    // ✅ URL ya local path — dono se buffer lo
    const imageBuffer = await getImageBuffer(filePathOrUrl);
    let labels = [];

    // Step 1: Image Classification (ViT)
    try {
      console.log("🔍 Running image classification...");
      const classResults = await queryHuggingFace(
        MODELS.classification,
        imageBuffer
      );
      const classLabels = Array.isArray(classResults) ? classResults : [];
      const filtered = classLabels
        .filter((r) => r.score > 0.1)
        .map((r) => ({
          label: r.label.toLowerCase().split(",")[0].trim(),
          score: +r.score.toFixed(2),
        }));
      labels.push(...filtered);
      console.log(`✅ Classification: ${filtered.length} tags mili`);
    } catch (err) {
      console.error("❌ Classification failed:", err.message);
    }

    // Step 2: Image Captioning (BLIP)
    try {
      console.log("📝 Running image captioning...");
      const captionResult = await queryHuggingFace(
        MODELS.captioning,
        imageBuffer
      );
      const caption = Array.isArray(captionResult)
        ? captionResult[0]?.generated_text
        : captionResult?.generated_text;

      if (caption) {
        console.log(`📷 Caption: "${caption}"`);
        const captionTags = extractTagsFromCaption(caption);
        labels.push(...captionTags);
        labels.push({ label: caption.toLowerCase().trim(), score: 0.9 });
      }
    } catch (err) {
      console.error("❌ Captioning failed:", err.message);
    }

    // Step 3: Dedupe + Normalize
    labels = dedupeLabels(labels);

    // Step 4: Fillers agar tags kam hain
    if (labels.length < MIN_TAGS) {
      const fillers = ["photo", "image", "memories", "media", "content"];
      for (const f of fillers) {
        if (labels.length >= MIN_TAGS) break;
        if (!labels.some((l) => l.label === f)) {
          labels.push({ label: f, score: 0.4 });
        }
      }
    }

    // Step 5: DB mein save karo
    await Promise.allSettled(labels.map((l) => Tag.upsertTag(l.label, "ai")));
    await Media.findByIdAndUpdate(mediaId, {
      aiTags: labels,
      aiTagsProcessed: true,
    });

    console.log(
      `✅ Media ${mediaId} — ${labels.length} tags: [${labels
        .map((l) => l.label)
        .join(", ")}]`
    );
    return labels;
  } catch (err) {
    await Media.findByIdAndUpdate(mediaId, {
      aiTags: [],
      aiTagsProcessed: true,
    }).catch(() => {});
    console.error(`❌ AI tagging failed for ${mediaId}:`, err.message);
    return [];
  }
}

export async function syncManualTags(tagNames) {
  if (!tagNames?.length) return;
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
      aiTags.map((t) => (typeof t === "string" ? { label: t, score: 0.8 } : t))
    );
    await Promise.allSettled(
      updates.aiTags.map((l) => Tag.upsertTag(l.label, "ai"))
    );
  }
  return Media.findByIdAndUpdate(mediaId, updates, { new: true });
}
