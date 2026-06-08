import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/axios";

const TagDetailPage = () => {
  const { slug } = useParams();
  const [tag, setTag] = useState(null);
  const [media, setMedia] = useState([]);
  const [relatedTags, setRelatedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setPage(1);
    fetchTag(1);
  }, [slug]);

  useEffect(() => {
    if (page > 1) fetchTag(page);
  }, [page]);

  const fetchTag = async (p) => {
    setLoading(true);
    try {
      const res = await API.get(`/tags/${slug}?page=${p}&limit=20`);
      setTag(res.data.tag);
      setMedia(res.data.media);
      setRelatedTags(res.data.relatedTags || []);
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to fetch tag:", err);
    }
    setLoading(false);
  };

  if (loading && !tag) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg, #f0f4ff 0%, #faf5ff 50%, #fff0f6 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <Navbar />
        <div style={{ textAlign: "center", padding: "100px", color: "#a78bfa", fontSize: "18px" }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f0f4ff 0%, #faf5ff 50%, #fff0f6 100%)",
        fontFamily: "Georgia, serif",
      }}
    >
      <Navbar />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Link to="/tags" style={{ color: "#a78bfa", textDecoration: "none", fontSize: "14px", fontWeight: "500" }}>
            ← All Tags
          </Link>
          <span style={{ color: "#d1d5db" }}>/</span>
          <span style={{ color: "#6b7280", fontSize: "14px" }}>#{tag?.name}</span>
        </div>

        {/* Tag Header */}
        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "32px 36px",
            marginBottom: "28px",
            boxShadow: "0 4px 20px rgba(167,139,250,0.08)",
            border: "1px solid rgba(167,139,250,0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#7c3aed", margin: "0 0 6px" }}>
              #{tag?.name}
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "15px", margin: 0 }}>
              📷 {total} photo{total !== 1 ? "s" : ""} tagged
              {tag?.source && (
                <span
                  style={{
                    marginLeft: "10px",
                    background: tag.source === "ai" ? "#dbeafe" : tag.source === "both" ? "#fef3c7" : "#f0fdf4",
                    color: tag.source === "ai" ? "#2563eb" : tag.source === "both" ? "#d97706" : "#16a34a",
                    borderRadius: "6px",
                    padding: "2px 8px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {tag.source === "ai" ? "AI Generated" : tag.source === "both" ? "AI + Manual" : "Manual"}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Related Tags */}
        {relatedTags.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#6b7280", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Related Tags
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {relatedTags.map((rt) => (
                <Link key={rt._id} to={`/tags/${rt.slug}`} style={{ textDecoration: "none" }}>
                  <span
                    style={{
                      background: "#f0f4ff",
                      color: "#7c3aed",
                      border: "1px solid #e9d5ff",
                      borderRadius: "20px",
                      padding: "4px 14px",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "inline-block",
                    }}
                  >
                    #{rt.name} ({rt.mediaCount})
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Media Grid */}
        {media.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "20px", border: "1px solid rgba(167,139,250,0.15)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🖼️</div>
            <p style={{ color: "#9ca3af", fontSize: "16px" }}>No photos with this tag yet</p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {media.map((item) => (
                <Link key={item._id} to={`/events/${item.eventId?._id || ""}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1px solid rgba(167,139,250,0.12)",
                      boxShadow: "0 2px 12px rgba(167,139,250,0.06)",
                      transition: "all 0.25s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 12px 28px rgba(167,139,250,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 2px 12px rgba(167,139,250,0.06)";
                    }}
                  >
                    <img
                      src={item.url}
                      alt=""
                      style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
                      loading="lazy"
                    />
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#1e1b4b", margin: "0 0 4px" }}>
                        {item.eventId?.name || "Photo"}
                      </p>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 6px" }}>
                        By {item.uploadedBy?.name || "—"} · {new Date(item.createdAt).toLocaleDateString("en-IN")}
                      </p>
                      {item.tags?.length > 0 && (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {item.tags.slice(0, 4).map((t) => (
                            <span key={t} style={{ background: "#f0f4ff", color: "#a78bfa", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: "500" }}>
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ background: page === 1 ? "#e5e7eb" : "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#9ca3af" : "#1e1b4b" }}
                >
                  ← Prev
                </button>
                <span style={{ display: "flex", alignItems: "center", fontSize: "13px", color: "#6b7280" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ background: page === totalPages ? "#e5e7eb" : "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#9ca3af" : "#1e1b4b" }}
                >
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

export default TagDetailPage;
