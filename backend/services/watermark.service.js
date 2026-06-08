// services/watermark.service.js — Dynamic watermark generation using sharp
// ─────────────────────────────────────────────────────────────────────────────
// Applies a semi-transparent text watermark to the bottom of an image.
// Original image remains unchanged — watermark is generated on-demand.
// ─────────────────────────────────────────────────────────────────────────────

import sharp from "sharp";

/**
 * Apply a watermark to an image buffer.
 *
 * @param {Object} opts
 * @param {Buffer} opts.imageBuffer — original image buffer
 * @param {string} opts.clubName — e.g. "SnapVault"
 * @param {string} opts.eventName — e.g. "Hackathon 2026"
 * @param {string} opts.userName — e.g. "John Doe"
 * @param {string} opts.timestamp — e.g. "2026-06-06 14:30"
 * @param {string} [opts.format="jpeg"] — output format ("jpeg" or "png")
 * @returns {Promise<Buffer>} — watermarked image buffer
 */
export async function applyWatermark({
  imageBuffer,
  clubName = "SnapVault",
  eventName = "Event",
  userName = "User",
  timestamp,
  format = "jpeg",
}) {
  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1200;
  const height = metadata.height || 800;

  // Build watermark text
  const watermarkText = `${clubName} | ${eventName} | ${userName} | ${timestamp}`;

  // Calculate font size based on image width (responsive)
  const fontSize = Math.max(12, Math.min(24, Math.floor(width / 50)));
  const padding = Math.floor(fontSize * 0.8);
  const barHeight = fontSize + padding * 2;

  // Create SVG overlay with semi-transparent background bar
  const svgOverlay = `
    <svg width="${width}" height="${height}">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500');
        </style>
      </defs>
      <!-- Semi-transparent bar at bottom -->
      <rect
        x="0"
        y="${height - barHeight}"
        width="${width}"
        height="${barHeight}"
        fill="rgba(0, 0, 0, 0.55)"
      />
      <!-- Watermark text -->
      <text
        x="${padding}"
        y="${height - padding}"
        font-family="Inter, Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="500"
        fill="rgba(255, 255, 255, 0.85)"
        letter-spacing="0.5"
      >${escapeXml(watermarkText)}</text>
    </svg>
  `;

  // Composite watermark onto image
  let pipeline = sharp(imageBuffer).composite([
    {
      input: Buffer.from(svgOverlay),
      gravity: "southeast",
    },
  ]);

  // Output in requested format
  if (format === "png") {
    pipeline = pipeline.png({ quality: 90 });
  } else {
    pipeline = pipeline.jpeg({ quality: 85 });
  }

  return pipeline.toBuffer();
}

/**
 * Escape special XML characters to prevent SVG injection.
 */
function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
