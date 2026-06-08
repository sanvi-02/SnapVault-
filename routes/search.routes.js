// routes/search.routes.js
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  globalSearch,
  searchSuggestions,
} from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", protect, globalSearch);
router.get("/suggestions", protect, searchSuggestions);

export default router;
