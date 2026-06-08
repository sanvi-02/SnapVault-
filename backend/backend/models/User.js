import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "Photographer", "ClubMember", "Viewer"],
      default: "Viewer",
    },
    profilePic: { type: String, default: "" },

    // ── Face Recognition ──
    faceIndexed: { type: Boolean, default: false },
    facePublicId: { type: String, default: null },
    faceDescriptor: { type: [Number], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
