// Fallback vision provider — uses Sharp for image analysis when no AI API is configured
import sharp from "sharp";

const MIN_TAGS = 5;
const MAX_TAGS = 15;

export function isConfigured() {
  return true;
}

async function fetchImageBuffer(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function colorToTags(r, g, b) {
  const tags = [];
  const brightness = (r + g + b) / 3;

  if (brightness < 60) tags.push("night", "dark");
  else if (brightness > 200) tags.push("bright", "daylight");

  if (r > g + 30 && r > b + 30) tags.push("warm", "sunset");
  if (b > r + 20 && b > g + 20) tags.push("sky", "blue");
  if (g > r + 20 && g > b + 20) tags.push("nature", "green");
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) tags.push("monochrome");

  return tags;
}

function aspectToTags(width, height) {
  const ratio = width / height;
  if (ratio > 1.4) return ["landscape", "wide", "panorama"];
  if (ratio < 0.75) return ["portrait", "vertical", "people"];
  return ["photo", "event", "campus"];
}

function dedupeAndLimit(labels) {
  const seen = new Set();
  const result = [];
  for (const item of labels) {
    const label = item.label.toLowerCase().trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    result.push({ label, score: item.score });
    if (result.length >= MAX_TAGS) break;
  }
  return result;
}

export async function analyze(imageUrl) {
  try {
    const buffer = await fetchImageBuffer(imageUrl);
    const image = sharp(buffer);
    const [metadata, stats] = await Promise.all([
      image.metadata(),
      image.stats(),
    ]);

    const width = metadata.width || 800;
    const height = metadata.height || 600;
    const channel = stats.channels?.[0] || { mean: 128 };
    const r = stats.channels?.[0]?.mean ?? 128;
    const g = stats.channels?.[1]?.mean ?? 128;
    const b = stats.channels?.[2]?.mean ?? 128;

    const candidates = [
      ...aspectToTags(width, height).map((label, i) => ({
        label,
        score: 0.9 - i * 0.05,
      })),
      ...colorToTags(r, g, b).map((label, i) => ({
        label,
        score: 0.85 - i * 0.05,
      })),
      { label: "photography", score: 0.8 },
      { label: "media", score: 0.75 },
      { label: "gallery", score: 0.7 },
      { label: "collection", score: 0.65 },
    ];

    let tags = dedupeAndLimit(candidates);

    while (tags.length < MIN_TAGS) {
      const fillers = ["memories", "moments", "celebration", "community", "culture"];
      for (const f of fillers) {
        if (tags.length >= MIN_TAGS) break;
        if (!tags.some((t) => t.label === f)) {
          tags.push({ label: f, score: 0.5 });
        }
      }
      break;
    }

    return tags;
  } catch (err) {
    console.error("Fallback vision error:", err.message);
    return [
      { label: "photo", score: 0.9 },
      { label: "event", score: 0.85 },
      { label: "media", score: 0.8 },
      { label: "gallery", score: 0.75 },
      { label: "memories", score: 0.7 },
    ];
  }
}

export const providerName = "fallback-sharp";
