import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const MediaFeedCard = ({ item, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [likes, setLikes] = useState(item.likes?.length || 0);
  const [liked, setLiked] = useState(
    item.likes?.some((l) => (l._id || l) === (user?._id || user?.id)) || false
  );
  const [comments, setComments] = useState(item.comments || []);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await API.get(`/download/${item._id}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `snapvault_${item._id}.jpg`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
    setDownloading(false);
  };

  const handleTagClick = (tagName) => {
    const slug = tagName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    navigate(`/tags/${slug}`);
  };

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((prev) => (wasLiked ? prev - 1 : prev + 1));
    try {
      const res = await API.post(`/social/media/${item._id}/like`);
      setLikes(res.data.likes);
      setLiked(res.data.liked);
    } catch {
      setLiked(wasLiked);
      setLikes((prev) => (wasLiked ? prev + 1 : prev - 1));
    }
    setLikeLoading(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await API.post(`/social/media/${item._id}/comment`, {
        text: commentText.trim(),
      });
      setComments((prev) => [...prev, res.data]);
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/social/media/${item._id}/comment/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const avatarLetter = item.uploadedBy?.name?.charAt(0).toUpperCase() || "?";

  return (
    <div
      style={{
        background: "var(--bg-2)",
        borderRadius: "20px",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
        transition: "all 0.28s var(--ease-out)",
        animation: "slideUp 0.4s var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-medium)";
        e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.45)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}>
      {/* ── Author row ───────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "38px",
              height: "38px",
              background:
                "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              fontWeight: "700",
              color: "#fff",
              flexShrink: 0,
            }}>
            {avatarLetter}
          </div>
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: "var(--text-1)",
                margin: 0,
              }}>
              {item.uploadedBy?.name || "Unknown"}
            </p>
            <p style={{ fontSize: "11px", color: "var(--text-4)", margin: 0 }}>
              {new Date(item.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Visibility badge */}
        <span
          style={{
            background:
              item.visibility === "private"
                ? "rgba(244,63,94,0.1)"
                : "rgba(34,197,94,0.08)",
            color: item.visibility === "private" ? "#f43f5e" : "#22c55e",
            border: `1px solid ${
              item.visibility === "private"
                ? "rgba(244,63,94,0.2)"
                : "rgba(34,197,94,0.15)"
            }`,
            borderRadius: "6px",
            padding: "3px 9px",
            fontSize: "11px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}>
          {item.visibility === "private" ? "🔒 Private" : "🌐 Public"}
        </span>
      </div>

      {/* ── Image ────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          background: "var(--bg-3)",
          overflow: "hidden",
        }}>
        {!imgLoaded && (
          <div
            className="skeleton"
            style={{ width: "100%", height: "280px", borderRadius: 0 }}
          />
        )}
        <img
          src={item.url}
          alt="media"
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          style={{
            width: "100%",
            height: imgLoaded ? "auto" : "0",
            maxHeight: "500px",
            objectFit: "cover",
            display: "block",
            transition: "transform 0.4s var(--ease-out)",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        />
      </div>

      {/* ── Tags ─────────────────────────────────────── */}
      {(item.tags?.length > 0 || item.aiTags?.length > 0) && (
        <div
          style={{
            padding: "12px 18px 0",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
          }}>
          {item.tags?.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              style={{
                background: "rgba(139,92,246,0.12)",
                color: "#a78bfa",
                border: "1px solid transparent",
                borderRadius: "99px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "Inter,sans-serif",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#a78bfa";
                e.currentTarget.style.background = "rgba(139,92,246,0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.background = "rgba(139,92,246,0.12)";
              }}>
              #{tag}
            </button>
          ))}
          {item.aiTags?.slice(0, 3).map((at) => (
            <button
              key={at.label}
              onClick={() => handleTagClick(at.label)}
              style={{
                background: "rgba(59,130,246,0.08)",
                color: "#60a5fa",
                border: "none",
                borderRadius: "99px",
                padding: "3px 9px",
                fontSize: "10px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "Inter,sans-serif",
              }}>
              🤖 {at.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Engagement bar ───────────────────────────── */}
      <div
        style={{
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          borderTop: "1px solid var(--border-subtle)",
          marginTop: "12px",
        }}>
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          style={{
            background: liked ? "rgba(244,63,94,0.12)" : "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 13px",
            borderRadius: "99px",
            color: liked ? "#f43f5e" : "var(--text-3)",
            fontSize: "13px",
            fontWeight: "600",
            transition: "all 0.18s",
            fontFamily: "Inter,sans-serif",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(244,63,94,0.15)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = liked
              ? "rgba(244,63,94,0.12)"
              : "transparent")
          }>
          <span
            style={{
              fontSize: "16px",
              lineHeight: 1,
              display: "inline-block",
              transform: liked ? "scale(1.2)" : "scale(1)",
              transition: "transform 0.2s var(--ease-spring)",
              animation: liked && !likeLoading ? "heartbeat 0.5s ease" : "none",
            }}>
            {liked ? "❤️" : "🤍"}
          </span>
          <span>{likes > 0 ? likes : "Like"}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments((p) => !p)}
          style={{
            background: showComments ? "rgba(139,92,246,0.12)" : "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 13px",
            borderRadius: "99px",
            color: showComments ? "#c084fc" : "var(--text-3)",
            fontSize: "13px",
            fontWeight: "600",
            transition: "all 0.18s",
            fontFamily: "Inter,sans-serif",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(139,92,246,0.15)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = showComments
              ? "rgba(139,92,246,0.12)"
              : "transparent")
          }>
          <span style={{ fontSize: "15px", lineHeight: 1 }}>💬</span>
          <span>{comments.length > 0 ? comments.length : "Comment"}</span>
        </button>

        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            background: "transparent",
            border: "none",
            cursor: downloading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "7px 13px",
            borderRadius: "99px",
            color: "var(--text-3)",
            fontSize: "13px",
            fontWeight: "600",
            marginLeft: "auto",
            transition: "all 0.18s",
            fontFamily: "Inter,sans-serif",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }>
          <span style={{ fontSize: "14px", lineHeight: 1 }}>
            {downloading ? "⏳" : "⬇️"}
          </span>
          <span>
            {downloading
              ? "..."
              : item.downloadCount > 0
              ? item.downloadCount
              : "Save"}
          </span>
        </button>
      </div>

      {/* ── Comments section ─────────────────────────── */}
      {showComments && (
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            background: "rgba(0,0,0,0.2)",
            padding: "14px 18px",
            animation: "slideDown 0.2s ease",
          }}>
          <div
            style={{
              maxHeight: "220px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "12px",
            }}>
            {comments.length === 0 ? (
              <p
                style={{
                  color: "var(--text-4)",
                  fontSize: "12px",
                  textAlign: "center",
                  padding: "8px 0",
                  fontFamily: "Inter,sans-serif",
                }}>
                Be the first to comment…
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c._id}
                  style={{
                    background: "var(--glass-bg)",
                    borderRadius: "10px",
                    padding: "9px 13px",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "var(--accent-3)",
                        fontFamily: "Inter,sans-serif",
                      }}>
                      {c.user?.name || "User"}
                    </span>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "12px",
                        color: "var(--text-2)",
                        lineHeight: "1.45",
                        wordBreak: "break-word",
                        fontFamily: "Inter,sans-serif",
                      }}>
                      {c.text}
                    </p>
                  </div>
                  {((c.user?._id || c.user?.id || c.user) ===
                    (user?._id || user?.id) ||
                    user?.role === "Admin") && (
                    <button
                      onClick={() => handleDeleteComment(c._id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#f87171",
                        fontSize: "12px",
                        padding: "2px",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => (e.target.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.target.style.color = "#f87171")}>
                      ✕
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleAddComment}
            style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              style={{
                flex: 1,
                border: "1px solid var(--border-medium)",
                borderRadius: "99px",
                padding: "8px 16px",
                fontSize: "12px",
                fontFamily: "Inter,sans-serif",
                color: "var(--text-1)",
                outline: "none",
                background: "rgba(0,0,0,0.25)",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent-1)";
                e.target.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-medium)";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              style={{
                background:
                  submitting || !commentText.trim()
                    ? "rgba(255,255,255,0.06)"
                    : "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                color:
                  submitting || !commentText.trim() ? "var(--text-4)" : "#fff",
                border: "none",
                borderRadius: "99px",
                padding: "8px 18px",
                fontSize: "12px",
                fontWeight: "600",
                cursor:
                  submitting || !commentText.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                fontFamily: "Inter,sans-serif",
                whiteSpace: "nowrap",
              }}>
              {submitting ? "…" : "Post"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MediaFeedCard;
