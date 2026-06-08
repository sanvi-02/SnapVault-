// pages/TagsPage.jsx — Updated with working trending
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/axios";

const TagsPage = () => {
  const [tags, setTags] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Fetch tags when page or search changes
  useEffect(() => {
    fetchTags();
  }, [page, searchQuery]);

  const fetchTags = async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: 30 });
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await API.get(`/tags?${params}`, {
        signal: abortControllerRef.current.signal,
      });

      setTags(res.data.tags || []);
      setTrending(res.data.trending || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {

      // Ignore cancelled requests
      if (
        err.name === "CanceledError" ||
        err.code === "ERR_CANCELED"
      ) {
        return;
      }

      console.error("Failed to fetch tags:", err);
      setError("Failed to load tags. Please try again.");
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  // Color palette for tag cards
  const colors = [
    { bg: "#f0f4ff", border: "#ddd6fe", text: "#7c3aed" },
    { bg: "#fdf4ff", border: "#f3d5ff", text: "#a855f7" },
    { bg: "#fff0f6", border: "#fecdd3", text: "#e11d48" },
    { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
    { bg: "#eff6ff", border: "#bfdbfe", text: "#2563eb" },
    { bg: "#fffbeb", border: "#fde68a", text: "#d97706" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #f0f4ff 0%, #faf5ff 50%, #fff0f6 100%)",
        fontFamily: "Georgia, serif",
      }}>
      <Navbar />

      <div
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "700",
              color: "#1e1b4b",
              marginBottom: "8px",
            }}>
            🏷️ Explore Tags
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "15px" }}>
            Discover photos by topic, category, and AI-generated labels
          </p>
        </div>

        {/* Search Tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#fff",
            border: "1.5px solid rgba(167,139,250,0.3)",
            borderRadius: "14px",
            padding: "10px 16px",
            marginBottom: "32px",
            maxWidth: "400px",
            boxShadow: "0 2px 12px rgba(167,139,250,0.06)",
          }}>
          <span style={{ fontSize: "16px", marginRight: "10px" }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1); // Reset to page 1 when searching
            }}
            placeholder="Search tags..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "14px",
              color: "#1e1b4b",
              fontFamily: "Georgia, serif",
              width: "100%",
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#991b1b",
              marginBottom: "24px",
              fontSize: "14px",
            }}>
            ⚠️ {error}
          </div>
        )}

        {/* Trending Tags — FIXED: Removed !searchQuery condition */}
        {trending && trending.length > 0 && !loading && (
          <div style={{ marginBottom: "36px" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#1e1b4b",
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
              🔥 Trending Tags
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {trending.slice(0, 12).map((tag, i) => {
                const c = colors[i % colors.length];
                return (
                  <Link
                    key={tag._id}
                    to={`/tags/${tag.slug}`}
                    style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        background: c.bg,
                        border: `1.5px solid ${c.border}`,
                        borderRadius: "24px",
                        padding: "8px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 6px 16px rgba(0,0,0,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      <span
                        style={{
                          color: c.text,
                          fontWeight: "600",
                          fontSize: "14px",
                        }}>
                        #{tag.name}
                      </span>
                      <span
                        style={{
                          background: "rgba(0,0,0,0.06)",
                          borderRadius: "99px",
                          padding: "2px 8px",
                          fontSize: "11px",
                          color: c.text,
                          fontWeight: "600",
                        }}>
                        {tag.mediaCount || 0}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* All Tags Grid */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#a78bfa",
              fontSize: "16px",
            }}>
            Loading tags...
          </div>
        ) : tags.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px",
              background: "#fff",
              borderRadius: "20px",
              border: "1px solid rgba(167,139,250,0.15)",
            }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏷️</div>
            <p style={{ color: "#9ca3af", fontSize: "16px" }}>
              {searchQuery
                ? `No tags matching "${searchQuery}"`
                : "No tags available"}
            </p>
          </div>
        ) : (
          <>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: "#1e1b4b",
                marginBottom: "14px",
              }}>
              All Tags ({tags.length})
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "12px",
                marginBottom: "24px",
              }}>
              {tags.map((tag, i) => {
                const c = colors[i % colors.length];
                return (
                  <Link
                    key={tag._id}
                    to={`/tags/${tag.slug}`}
                    style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        background: "#fff",
                        borderRadius: "14px",
                        padding: "16px",
                        border: "1px solid rgba(167,139,250,0.12)",
                        boxShadow: "0 2px 8px rgba(167,139,250,0.05)",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 20px rgba(167,139,250,0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(167,139,250,0.05)";
                      }}>
                      <span
                        style={{
                          color: c.text,
                          fontWeight: "700",
                          fontSize: "16px",
                        }}>
                        #{tag.name}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "8px",
                        }}>
                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                          📷 {tag.mediaCount || 0} photo
                          {tag.mediaCount !== 1 ? "s" : ""}
                        </span>
                        <span
                          style={{
                            background:
                              tag.source === "ai"
                                ? "#dbeafe"
                                : tag.source === "both"
                                  ? "#fef3c7"
                                  : "#f0fdf4",
                            color:
                              tag.source === "ai"
                                ? "#2563eb"
                                : tag.source === "both"
                                  ? "#d97706"
                                  : "#16a34a",
                            borderRadius: "6px",
                            padding: "1px 6px",
                            fontSize: "10px",
                            fontWeight: "600",
                          }}>
                          {tag.source === "ai"
                            ? "AI"
                            : tag.source === "both"
                              ? "AI+Manual"
                              : "Manual"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  alignItems: "center",
                }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    background: page === 1 ? "#e5e7eb" : "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    color: page === 1 ? "#9ca3af" : "#1e1b4b",
                    fontWeight: "500",
                  }}>
                  ← Prev
                </button>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}>
                  Page <strong style={{ margin: "0 4px" }}>{page}</strong> of{" "}
                  <strong style={{ margin: "0 4px" }}>{totalPages}</strong>
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    background: page === totalPages ? "#e5e7eb" : "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    color: page === totalPages ? "#9ca3af" : "#1e1b4b",
                    fontWeight: "500",
                  }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TagsPage;
