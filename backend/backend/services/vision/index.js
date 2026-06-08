// Modular vision service — swap providers via VISION_PROVIDER env var
// Supported: google-vision | fallback-sharp | (future: openai, clip, gemini)
import * as googleVision from "./googleVision.provider.js";
import * as fallbackVision from "./fallbackVision.provider.js";

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const cache = new Map();

const PROVIDERS = {
  "google-vision": googleVision,
  "fallback-sharp": fallbackVision,
};

function getActiveProvider() {
  const preferred = process.env.VISION_PROVIDER || "auto";

  if (preferred === "google-vision" && googleVision.isConfigured()) {
    return googleVision;
  }
  if (preferred === "fallback-sharp") {
    return fallbackVision;
  }

  // auto: prefer Google Vision if configured, else fallback
  if (googleVision.isConfigured()) return googleVision;
  return fallbackVision;
}

export function isVisionConfigured() {
  return getActiveProvider().isConfigured();
}

export function getProviderName() {
  return getActiveProvider().providerName || "unknown";
}

export async function analyzeImage(imageUrl) {
  const cached = cache.get(imageUrl);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.labels;
  }

  const provider = getActiveProvider();
  const labels = await provider.analyze(imageUrl);

  cache.set(imageUrl, { labels, ts: Date.now() });

  // Prevent unbounded cache growth
  if (cache.size > 500) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }

  return labels;
}

export { googleVision, fallbackVision };
