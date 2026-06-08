// src/pages/EventDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import API from "../api/axios";

// ─── Single Media Card ────────────────────────────────────────────────────────
const MediaCard = ({ item, currentUser }) => {
  const navigate = useNavigate();
  const [likes, setLikes] = useState(item.likes?.length || 0);
  const [liked, setLiked] = useState(
    item.likes?.some(
      (l) => (l._id || l) === (currentUser?._id || currentUser?.id)
    ) || false
  );
  const [comments, setComments] = useState(item.comments || []);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
    // Optimistic update
    setLiked((prev) => !prev);
    setLikes((prev) => (liked ? prev - 1 : prev + 1));
    try {
      const res = await API.post(`/social/media/${item._id}/like`);
      setLikes(res.data.likes);
      setLiked(res.data.liked);
    } catch (err) {
      // Revert on error
      setLiked((prev) => !prev);
      setLikes((prev) => (liked ? prev + 1 : prev - 1));
      console.error(err);
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

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        borderRadius: "18px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        backdropFilter: "blur(12px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
        e.currentTarget.style.boxShadow = "0 16px 40px rgba(0, 0, 0, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";
      }}>
      {/* Image Container with Badge */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#12141c",
        }}>
        <img
          src={item.url}
          alt="media"
          style={{
            width: "100%",
            height: "230px",
            objectFit: "cover",
            display: "block",
            transition: "transform 0.4s",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.04)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        />
        {item.visibility === "private" && (
          <span
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "rgba(0,0,0,0.75)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: "600",
              backdropFilter: "blur(4px)",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}>
            🔒 Private
          </span>
        )}
      </div>

      {/* Info row */}
      <div style={{ padding: "16px 16px 0" }}>
        <p
          style={{
            color: "#9ca3af",
            fontSize: "12px",
            margin: 0,
            fontWeight: "500",
          }}>
          By{" "}
          <span style={{ color: "#f3f4f6", fontWeight: "600" }}>
            {item.uploadedBy?.name || "—"}
          </span>{" "}
          • {new Date(item.createdAt).toLocaleDateString("en-IN")}
        </p>

        {/* Tags — clickable */}
        {item.tags?.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "10px",
            }}>
            {item.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                style={{
                  background: "rgba(139, 92, 246, 0.15)",
                  color: "#a78bfa",
                  borderRadius: "20px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: "600",
                  border: "1px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "Inter, sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#a78bfa";
                  e.currentTarget.style.background = "rgba(139, 92, 246, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)";
                }}>
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* AI Tags */}
        {item.aiTags?.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px",
              marginTop: "8px",
            }}>
            {item.aiTags.slice(0, 5).map((at) => (
              <button
                key={at.label}
                onClick={() => handleTagClick(at.label)}
                style={{
                  background: "rgba(59, 130, 246, 0.12)",
                  color: "#60a5fa",
                  borderRadius: "20px",
                  padding: "2px 8px",
                  fontSize: "10px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}>
                🤖 {at.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Like & Comment Bar ─────────────────────────────── */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          marginTop: "14px",
          background: "rgba(0, 0, 0, 0.15)",
        }}>
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={likeLoading}
          style={{
            background: liked ? "rgba(244,63,94,0.15)" : "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "20px",
            transition: "all 0.15s",
            color: liked ? "#f43f5e" : "#9ca3af",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(244,63,94,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = liked
              ? "rgba(244,63,94,0.15)"
              : "none";
          }}>
          <span
            style={{
              fontSize: "16px",
              lineHeight: 1,
              transform: liked ? "scale(1.2)" : "scale(1)",
              transition: "transform 0.15s",
              display: "inline-block",
            }}>
            {liked ? "❤️" : "🤍"}
          </span>
          <span style={{ fontSize: "13px", fontWeight: "600" }}>
            {likes > 0 ? likes : "Like"}
          </span>
        </button>

        {/* Comment toggle button */}
        <button
          onClick={() => setShowComments((prev) => !prev)}
          style={{
            background: showComments ? "rgba(139,92,246,0.15)" : "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "20px",
            transition: "all 0.15s",
            color: showComments ? "#c084fc" : "#9ca3af",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(139,92,246,0.2)")
          }
          onMouseLeave={(e) => {
            e.currentTarget.style.background = showComments
              ? "rgba(139,92,246,0.15)"
              : "none";
          }}>
          <span style={{ fontSize: "15px", lineHeight: 1 }}>💬</span>
          <span style={{ fontSize: "13px", fontWeight: "600" }}>
            {comments.length > 0 ? comments.length : "Comment"}
          </span>
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            background: downloading ? "rgba(255,255,255,0.05)" : "none",
            border: "none",
            cursor: downloading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            borderRadius: "20px",
            transition: "all 0.15s",
            color: "#9ca3af",
            fontFamily: "Inter, sans-serif",
            marginLeft: "auto",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
          onMouseLeave={(e) => {
            e.currentTarget.style.background = downloading
              ? "rgba(255,255,255,0.05)"
              : "none";
          }}>
          <span style={{ fontSize: "14px", lineHeight: 1 }}>
            {downloading ? "⏳" : "⬇️"}
          </span>
          <span style={{ fontSize: "12px", fontWeight: "600" }}>
            {downloading
              ? "..."
              : item.downloadCount > 0
              ? item.downloadCount
              : "Download"}
          </span>
        </button>
      </div>

      {/* ── Comments Section (expandable) ─────────────────── */}
      {showComments && (
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            background: "rgba(0, 0, 0, 0.25)",
            padding: "14px 16px",
            animation: "slideDown 0.2s ease",
          }}>
          {/* Existing comments */}
          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "12px",
            }}>
            {comments.length === 0 ? (
              <p
                style={{
                  color: "#6b7280",
                  fontSize: "12px",
                  textAlign: "center",
                  margin: "8px 0",
                  fontFamily: "Inter, sans-serif",
                }}>
                No comments yet.
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c._id}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    border: "1px solid rgba(255, 255, 255, 0.04)",
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
                        color: "#a78bfa",
                        fontFamily: "Inter, sans-serif",
                      }}>
                      {c.user?.name || "User"}
                    </span>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "12px",
                        color: "#e5e7eb",
                        fontFamily: "Inter, sans-serif",
                        lineHeight: "1.4",
                        wordBreak: "break-word",
                      }}>
                      {c.text}
                    </p>
                  </div>
                  {/* Delete button — show if own comment or admin */}
                  {((c.user?._id || c.user?.id || c.user) ===
                    (currentUser?._id || currentUser?.id) ||
                    currentUser?.role === "Admin") && (
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
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.target.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.target.style.color = "#f87171")}
                      title="Delete">
                      ✕
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add comment input */}
          <form
            onSubmit={handleAddComment}
            style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              style={{
                flex: 1,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "20px",
                padding: "8px 14px",
                fontSize: "12px",
                fontFamily: "Inter, sans-serif",
                color: "#f3f4f6",
                outline: "none",
                background: "rgba(0,0,0,0.3)",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8b5cf6";
                e.target.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.2)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.12)";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              style={{
                background:
                  submitting || !commentText.trim()
                    ? "rgba(255, 255, 255, 0.08)"
                    : "linear-gradient(135deg, #8b5cf6, #ec4899)",
                color: submitting || !commentText.trim() ? "#9ca3af" : "#fff",
                border: "none",
                borderRadius: "20px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: "600",
                cursor:
                  submitting || !commentText.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                fontFamily: "Inter, sans-serif",
                whiteSpace: "nowrap",
              }}>
              {submitting ? "..." : "Post"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ─── EventDetail Page ─────────────────────────────────────────────────────────
const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, mediaRes] = await Promise.all([
          API.get(`/events/${id}`),
          API.get(`/media/event/${id}`),
        ]);
        setEvent(eventRes.data);
        // Populate each media item with likes/comments from detail endpoint
        const detailedMedia = await Promise.all(
          mediaRes.data.map((item) =>
            API.get(`/social/media/${item._id}`)
              .then((r) => r.data)
              .catch(() => item)
          )
        );
        setMedia(detailedMedia);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0b0d",
          fontFamily: "Inter, sans-serif",
        }}>
        <Navbar />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "100px 0",
            color: "#9ca3af",
          }}>
          <div
            style={{
              border: "3px solid rgba(255, 255, 255, 0.1)",
              borderTop: "3px solid #8b5cf6",
              borderRadius: "50%",
              width: "30px",
              height: "30px",
              animation: "spin 1s linear infinite",
              marginRight: "12px",
            }}
          />
          <span style={{ fontSize: "15px", fontWeight: "500" }}>
            Loading album details...
          </span>
        </div>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0b0d",
        color: "#f3f4f6",
        fontFamily: "Inter, sans-serif",
      }}>
      <Navbar />

      <div
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 24px" }}>
        {/* Event Header */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "24px",
            padding: "36px 40px",
            marginBottom: "36px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
            backdropFilter: "blur(12px)",
          }}>
          <div>
            <span
              style={{
                background: "rgba(139, 92, 246, 0.15)",
                color: "#a78bfa",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "8px",
                padding: "4px 12px",
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
              {event?.category}
            </span>
            <h1
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#f3f4f6",
                margin: "12px 0 6px",
                letterSpacing: "-0.02em",
              }}>
              {event?.name}
            </h1>
            <p
              style={{ color: "#9ca3af", fontSize: "15px", lineHeight: "1.5" }}>
              {event?.description}
            </p>
            <p
              style={{
                color: "#c084fc",
                fontSize: "13px",
                marginTop: "10px",
                fontWeight: "500",
              }}>
              📅{" "}
              {new Date(event?.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {(user?.role === "Admin" || user?.role === "Photographer") && (
            <Link
              to={`/upload/${id}`}
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: "600",
                boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}>
              + Upload Photos
            </Link>
          )}
        </div>

        {/* Media Grid */}
        {media.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 40px",
              background: "rgba(255, 255, 255, 0.02)",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(8px)",
            }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🖼️</div>
            <p style={{ color: "#9ca3af", fontSize: "16px" }}>
              No photos uploaded to this album yet.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: "24px",
            }}>
            {media.map((item) => (
              <MediaCard key={item._id} item={item} currentUser={user} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 500px; }
        }
      `}</style>
    </div>
  );
};

export default EventDetail;
