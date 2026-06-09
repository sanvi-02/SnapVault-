import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import { v2 as cloudinary } from "cloudinary";
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import socialRoutes from "./routes/social.routes.js";
import facialRoutes from "./routes/face.routes.js";
import searchRoutes from "./routes/search.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import downloadRoutes from "./routes/download.routes.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = http.createServer(app);

// ─── CORS Helper ─────────────────────────────────────────────────────────────
function isAllowedOrigin(origin) {
  const allowed = [
    /^http:\/\/localhost:\d+$/, // local dev
    /^https:\/\/snap-vault-.*\.vercel\.app$/, // sab Vercel URLs
  ];
  return !origin || allowed.some((r) => r.test(origin));
}

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error("CORS blocked: " + origin));
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Socket joined room: ${userId}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight requests ke liye zaroori
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/face", facialRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/download", downloadRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok" }));

// ─── MongoDB + Server Start ───────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
