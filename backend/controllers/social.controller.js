import Media from "../models/Media.js";
import Notification from "../models/Notification.js";

// Helper: get socket io instance
const getIO = (req) => req.app.get("io");

// ─── LIKE / UNLIKE ────────────────────────────────────────────────────────────
export const toggleLike = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const userId = req.user._id;

    const media = await Media.findById(mediaId).populate("uploadedBy", "name");
    if (!media) return res.status(404).json({ message: "Media not found" });

    const alreadyLiked = media.likes.includes(userId);

    if (alreadyLiked) {
      // Unlike
      media.likes = media.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      await media.save();
      return res.json({ likes: media.likes.length, liked: false });
    } else {
      // Like
      media.likes.push(userId);
      await media.save();

      // Send notification only if liker is NOT the uploader and uploader exists
      if (media.uploadedBy && media.uploadedBy._id.toString() !== userId.toString()) {
        const notification = await Notification.create({
          recipient: media.uploadedBy._id,
          sender: userId,
          type: "like",
          media: media._id,
          message: `${req.user.name} liked your photo`,
        });

        // Populate sender info for socket payload
        const populated = await notification.populate("sender", "name");

        // Emit to uploader's socket room
        getIO(req)
          .to(media.uploadedBy._id.toString())
          .emit("new_notification", {
            _id: populated._id,
            type: "like",
            message: populated.message,
            sender: { name: req.user.name },
            media: media._id,
            createdAt: populated.createdAt,
            read: false,
          });
      }

      return res.json({ likes: media.likes.length, liked: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADD COMMENT ──────────────────────────────────────────────────────────────
export const addComment = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text?.trim())
      return res.status(400).json({ message: "Comment cannot be empty" });

    const media = await Media.findById(mediaId).populate("uploadedBy", "name");
    if (!media) return res.status(404).json({ message: "Media not found" });

    const comment = { user: userId, text: text.trim() };
    media.comments.push(comment);
    await media.save();

    // Return the last added comment (with populated user)
    const updatedMedia = await Media.findById(mediaId)
      .populate("comments.user", "name")
      .select("comments");

    const newComment = updatedMedia.comments[updatedMedia.comments.length - 1];

    // Notify uploader (if not self and uploader exists)
    if (media.uploadedBy && media.uploadedBy._id.toString() !== userId.toString()) {
      const notification = await Notification.create({
        recipient: media.uploadedBy._id,
        sender: userId,
        type: "comment",
        media: media._id,
        message: `${req.user.name} commented on your photo: "${text
          .trim()
          .slice(0, 40)}${text.length > 40 ? "…" : ""}"`,
      });

      getIO(req)
        .to(media.uploadedBy._id.toString())
        .emit("new_notification", {
          _id: notification._id,
          type: "comment",
          message: notification.message,
          sender: { name: req.user.name },
          media: media._id,
          createdAt: notification.createdAt,
          read: false,
        });
    }

    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── DELETE COMMENT ───────────────────────────────────────────────────────────
export const deleteComment = async (req, res) => {
  try {
    const { mediaId, commentId } = req.params;
    const userId = req.user._id;

    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ message: "Media not found" });

    const comment = media.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Only comment author or admin can delete
    if (
      comment.user.toString() !== userId.toString() &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    comment.deleteOne();
    await media.save();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── GET MEDIA WITH LIKES & COMMENTS ─────────────────────────────────────────
export const getMediaDetail = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const media = await Media.findById(mediaId)
      .populate("uploadedBy", "name")
      .populate("likes", "name")
      .populate("comments.user", "name");

    if (!media) return res.status(404).json({ message: "Media not found" });
    res.json(media);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("sender", "name")
      .populate("media", "url");

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
