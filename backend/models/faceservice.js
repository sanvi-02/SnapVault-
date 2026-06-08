// services/faceService.js — ES Module syntax
//
// SETUP:
//   npm install @vladmandic/face-api canvas node-fetch
//
// Download models into  backend/models/face_models/  from:
//   https://github.com/vladmandic/face-api/tree/master/model
// Required files:
//   ssd_mobilenetv1_model-weights_manifest.json  + shard file
//   face_landmark_68_model-weights_manifest.json + shard file
//   face_recognition_model-weights_manifest.json + shard file

import path from "path";
import { fileURLToPath } from "url";
import canvas from "canvas";
import * as faceapi from "@vladmandic/face-api";
import fetch from "node-fetch";

const { Canvas, Image, ImageData, createCanvas, loadImage } = canvas;

// Patch face-api to use node-canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, fetch });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, "../models_faceapi");

let modelsLoaded = false;

// ─── Load models once ─────────────────────────────────────────────────────────
export async function loadModels() {
  if (modelsLoaded) return;
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_DIR),
    faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_DIR),
    faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_DIR),
  ]);
  modelsLoaded = true;
  console.log("✅ Face-api models loaded");
}

// ─── Extract descriptor(s) from a URL or Buffer ───────────────────────────────
// Returns: number[][] — one 128-element array per detected face
export async function extractDescriptors(source) {
  await loadModels();

  let img;
  if (Buffer.isBuffer(source)) {
    img = await loadImage(source);
  } else {
    // source is a URL string
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to fetch image: ${source}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    img = await loadImage(buffer);
  }

  // Draw onto canvas (face-api needs a canvas element)
  const cvs = createCanvas(img.width, img.height);
  const ctx = cvs.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const detections = await faceapi
    .detectAllFaces(
      cvs,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 })
    )
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections.map((d) => Array.from(d.descriptor)); // Float32Array → number[]
}

// ─── Extract a SINGLE best descriptor (for selfie registration) ───────────────
// Returns: number[] | null
export async function extractSingleDescriptor(source) {
  await loadModels();

  let img;
  if (Buffer.isBuffer(source)) {
    img = await loadImage(source);
  } else {
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Failed to fetch image: ${source}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    img = await loadImage(buffer);
  }

  const cvs = createCanvas(img.width, img.height);
  const ctx = cvs.getContext("2d");
  ctx.drawImage(img, 0, 0);

  // Use larger minConfidence for selfies — we want the clearest face
  const detection = await faceapi
    .detectSingleFace(
      cvs,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
    )
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return Array.from(detection.descriptor);
}

// ─── Euclidean distance between two 128-d descriptors ─────────────────────────
export function euclideanDistance(d1, d2) {
  if (d1.length !== d2.length) throw new Error("Descriptor length mismatch");
  let sum = 0;
  for (let i = 0; i < d1.length; i++) {
    sum += (d1[i] - d2[i]) ** 2;
  }
  return Math.sqrt(sum);
}

// ─── Check if any face in descriptors[] matches the reference ─────────────────
// threshold: 0.5 = strict, 0.6 = balanced (recommended), 0.7 = lenient
export function isMatch(referenceDescriptor, descriptors, threshold = 0.55) {
  if (!descriptors || descriptors.length === 0)
    return { matched: false, score: null };

  let best = Infinity;
  for (const d of descriptors) {
    const dist = euclideanDistance(referenceDescriptor, d);
    if (dist < best) best = dist;
  }

  return {
    matched: best <= threshold,
    distance: best,
    // Convert to a 0–1 similarity score (closer to 1 = better match)
    score: Math.max(0, 1 - best / threshold),
  };
}
