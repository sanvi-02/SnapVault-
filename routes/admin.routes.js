import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "Admin")
    return res.status(403).json({ message: "Admin only" });
  next();
};

// Get all users
router.get("/users", protect, isAdmin, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// Update user role
router.put("/users/:id", protect, isAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true }
  ).select("-password");
  res.json(user);
});

// Delete user
router.delete("/users/:id", protect, isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

export default router;
