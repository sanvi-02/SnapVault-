// Google Cloud Vision API provider
const VISION_API_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const MIN_CONFIDENCE = 0.55;
const MIN_TAGS = 5;
const MAX_TAGS = 15;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isConfigured() {
  return !!(
    process.env.GOOGLE_VISION_API_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

async function imageUrlToBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

function normalizeLabels(annotations) {
  const seen = new Set();
  const labels = [];

  for (const a of annotations) {
    if (a.score < MIN_CONFIDENCE) continue;
    const label = a.description.toLowerCase().trim().replace(/\s+/g, " ");
    if (!label || seen.has(label)) continue;
    seen.add(label);
    labels.push({
      label,
      score: Math.round(a.score * 1000) / 1000,
    });
    if (labels.length >= MAX_TAGS) break;
  }

  return labels;
}

export async function analyze(imageUrl) {
  if (!isConfigured()) return [];

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  const base64Image = await imageUrlToBase64(imageUrl);

  const requestBody = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: "LABEL_DETECTION", maxResults: 25 }],
      },
    ],
  };

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const url = `${VISION_API_ENDPOINT}?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Vision API HTTP ${response.status}: ${errorBody.slice(0, 300)}`
        );
      }

      const data = await response.json();
      const annotations = data.responses?.[0]?.labelAnnotations || [];
      return normalizeLabels(annotations);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  console.error("Google Vision failed:", lastError?.message);
  return [];
}

export const providerName = "google-vision";
