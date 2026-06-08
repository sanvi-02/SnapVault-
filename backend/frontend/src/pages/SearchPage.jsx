import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/axios";

const FILTER_TABS = [
  { key: "all", label: "All", icon: "🔍" },
  { key: "events", label: "Events", icon: "🎉" },
  { key: "media", label: "Photos", icon: "📷" },
  { key: "tags", label: "Tags", icon: "🏷️" },
  { key: "photographers", label: "Photographers", icon: "👤" },
];

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialType);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialType, 1);
    }
  }, []);

  const performSearch = async (q, type = activeTab, p = page) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: q.trim(),
        type,
        page: p,
        limit: 12,
      });
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await API.get(`/search?${params}`);
      setResults(res.data.results);
      setSearchParams({ q: q.trim(), type });
    } catch (err) {
      console.error("Search error:", err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setPage(1);
    performSearch(query, activeTab, 1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    performSearch(query, tab, 1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000000",
        fontFamily: "Georgia, serif",
      }}>
      <Navbar />

      <div
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 24px" }}>
        {/* Search Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "700",
              color: "#e9d5ff",
              marginBottom: "16px",
            }}>
            Search
          </h1>

          <form
            onSubmit={handleSearch}
            style={{ display: "flex", gap: "12px" }}>
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                background: "#1a1425",
                border: "1.5px solid rgba(167,139,250,0.4)",
                borderRadius: "14px",
                padding: "10px 16px",
                boxShadow: "0 4px 16px rgba(167,139,250,0.15)",
              }}>
              <span style={{ fontSize: "18px", marginRight: "10px" }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, photos, tags, photographers..."
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "15px",
                  color: "#e9d5ff",
                  fontFamily: "Georgia, serif",
                  width: "100%",
                }}
                placeholder="Search events, photos, tags, photographers..."
              />
            </div>
            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #a78bfa, #f9a8d4)",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "12px 28px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(167,139,250,0.4)",
                fontFamily: "Georgia, serif",
                whiteSpace: "nowrap",
              }}>
              Search
            </button>
          </form>

          {/* Date Filters */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "12px",
              flexWrap: "wrap",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#a78bfa",
                  fontWeight: "600",
                }}>
                From:
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  border: "1px solid #3f3d52",
                  borderRadius: "8px",
                  padding: "5px 10px",
                  fontSize: "12px",
                  color: "#c4b5fd",
                  background: "#1a1425",
                  fontFamily: "Georgia, serif",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label
                style={{
                  fontSize: "12px",
                  color: "#a78bfa",
                  fontWeight: "600",
                }}>
                To:
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  border: "1px solid #3f3d52",
                  borderRadius: "8px",
                  padding: "5px 10px",
                  fontSize: "12px",
                  color: "#c4b5fd",
                  background: "#1a1425",
                  fontFamily: "Georgia, serif",
                }}
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                background:
                  activeTab === tab.key
                    ? "linear-gradient(135deg, #a78bfa, #f9a8d4)"
                    : "#1a1425",
                color: activeTab === tab.key ? "#fff" : "#a78bfa",
                border: activeTab === tab.key ? "none" : "1.5px solid #3f3d52",
                borderRadius: "10px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
                fontFamily: "Georgia, serif",
                boxShadow:
                  activeTab === tab.key
                    ? "0 4px 12px rgba(167,139,250,0.4)"
                    : "none",
              }}>
              <span>{tab.icon}</span> {tab.label}
              {results &&
                results[tab.key === "photos" ? "media" : tab.key]?.total >
                  0 && (
                  <span
                    style={{
                      background:
                        activeTab === tab.key
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(167,139,250,0.2)",
                      borderRadius: "99px",
                      padding: "1px 7px",
                      fontSize: "11px",
                      color: activeTab === tab.key ? "#fff" : "#a78bfa",
                    }}>
                    {results[tab.key === "photos" ? "media" : tab.key]?.total}
                  </span>
                )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#a78bfa",
              fontSize: "16px",
            }}>
            <div
              style={{
                fontSize: "40px",
                marginBottom: "12px",
                animation: "pulse 1.5s infinite",
              }}>
              🔍
            </div>
            Searching...
          </div>
        )}

        {/* Results */}
        {!loading && results && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Events */}
            {results.events?.items?.length > 0 &&
              (activeTab === "all" || activeTab === "events") && (
                <ResultSection
                  title="Events"
                  icon="🎉"
                  total={results.events.total}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "16px",
                    }}>
                    {results.events.items.map((event) => (
                      <Link
                        key={event._id}
                        to={`/events/${event._id}`}
                        style={{ textDecoration: "none" }}>
                        <div
                          style={{
                            background: "#1a1425",
                            borderRadius: "16px",
                            padding: "20px",
                            border: "1px solid rgba(167,139,250,0.25)",
                            boxShadow: "0 2px 12px rgba(167,139,250,0.1)",
                            transition: "all 0.2s",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 8px 24px rgba(167,139,250,0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 12px rgba(167,139,250,0.1)";
                          }}>
                          <span
                            style={{
                              background: "rgba(167,139,250,0.2)",
                              color: "#c4b5fd",
                              borderRadius: "6px",
                              padding: "2px 8px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}>
                            {event.category}
                          </span>
                          <h3
                            style={{
                              fontSize: "17px",
                              fontWeight: "700",
                              color: "#e9d5ff",
                              margin: "8px 0 4px",
                            }}>
                            {event.name}
                          </h3>
                          <p
                            style={{
                              color: "#9ca3af",
                              fontSize: "12px",
                              margin: 0,
                            }}>
                            📅{" "}
                            {new Date(event.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ResultSection>
              )}

            {/* Media */}
            {results.media?.items?.length > 0 &&
              (activeTab === "all" || activeTab === "media") && (
                <ResultSection
                  title="Photos"
                  icon="📷"
                  total={results.media.total}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "16px",
                    }}>
                    {results.media.items.map((item) => (
                      <Link
                        key={item._id}
                        to={`/events/${item.eventId?._id || ""}`}
                        style={{ textDecoration: "none" }}>
                        <div
                          style={{
                            background: "#1a1425",
                            borderRadius: "14px",
                            overflow: "hidden",
                            border: "1px solid rgba(167,139,250,0.2)",
                            boxShadow: "0 2px 12px rgba(167,139,250,0.1)",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                              "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                              "0 8px 24px rgba(167,139,250,0.25)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 12px rgba(167,139,250,0.1)";
                          }}>
                          <img
                            src={item.url}
                            alt=""
                            style={{
                              width: "100%",
                              height: "160px",
                              objectFit: "cover",
                            }}
                          />
                          <div style={{ padding: "10px 12px" }}>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#e9d5ff",
                                fontWeight: "600",
                                margin: "0 0 4px",
                              }}>
                              {item.eventId?.name || "Photo"}
                            </p>
                            {item.tags?.length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: "4px",
                                  flexWrap: "wrap",
                                }}>
                                {item.tags.slice(0, 3).map((t) => (
                                  <span
                                    key={t}
                                    style={{
                                      background: "rgba(167,139,250,0.2)",
                                      color: "#c4b5fd",
                                      borderRadius: "20px",
                                      padding: "1px 8px",
                                      fontSize: "10px",
                                    }}>
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
                </ResultSection>
              )}

            {/* Tags */}
            {results.tags?.items?.length > 0 &&
              (activeTab === "all" || activeTab === "tags") && (
                <ResultSection
                  title="Tags"
                  icon="🏷️"
                  total={results.tags.total}>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {results.tags.items.map((tag) => (
                      <Link
                        key={tag._id}
                        to={`/tags/${tag.slug}`}
                        style={{ textDecoration: "none" }}>
                        <div
                          style={{
                            background: "#1a1425",
                            border: "1.5px solid #3f3d52",
                            borderRadius: "24px",
                            padding: "8px 18px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#2a1f3d";
                            e.currentTarget.style.borderColor = "#a78bfa";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#1a1425";
                            e.currentTarget.style.borderColor = "#3f3d52";
                          }}>
                          <span
                            style={{
                              color: "#c4b5fd",
                              fontWeight: "600",
                              fontSize: "14px",
                            }}>
                            #{tag.name}
                          </span>
                          <span
                            style={{
                              background: "rgba(167,139,250,0.2)",
                              borderRadius: "99px",
                              padding: "2px 8px",
                              fontSize: "11px",
                              color: "#a78bfa",
                              fontWeight: "600",
                            }}>
                            {tag.mediaCount} photos
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ResultSection>
              )}

            {/* Photographers */}
            {results.photographers?.items?.length > 0 &&
              (activeTab === "all" || activeTab === "photographers") && (
                <ResultSection
                  title="Photographers"
                  icon="👤"
                  total={results.photographers.total}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "12px",
                    }}>
                    {results.photographers.items.map((p) => (
                      <div
                        key={p._id}
                        style={{
                          background: "#1a1425",
                          borderRadius: "14px",
                          padding: "16px",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          border: "1px solid rgba(167,139,250,0.25)",
                        }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #a78bfa, #f9a8d4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            color: "#fff",
                            fontWeight: "700",
                            flexShrink: 0,
                          }}>
                          {p.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#e9d5ff",
                              margin: 0,
                            }}>
                            {p.name}
                          </p>
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#a78bfa",
                              margin: "2px 0 0",
                            }}>
                            {p.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ResultSection>
              )}

            {/* Empty State */}
            {!results.events?.items?.length &&
              !results.media?.items?.length &&
              !results.tags?.items?.length &&
              !results.photographers?.items?.length && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "80px",
                    background: "#1a1425",
                    borderRadius: "20px",
                    border: "1px solid rgba(167,139,250,0.25)",
                  }}>
                  <div style={{ fontSize: "56px", marginBottom: "16px" }}>
                    🔍
                  </div>
                  <h3
                    style={{
                      color: "#e9d5ff",
                      fontSize: "20px",
                      marginBottom: "8px",
                    }}>
                    No results found
                  </h3>
                  <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                    Try different keywords or adjust your filters
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Initial empty state */}
        {!loading && !results && (
          <div
            style={{
              textAlign: "center",
              padding: "80px",
              background: "#1a1425",
              borderRadius: "20px",
              border: "1px solid rgba(167,139,250,0.25)",
            }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🔍</div>
            <h3
              style={{
                color: "#e9d5ff",
                fontSize: "20px",
                marginBottom: "8px",
              }}>
              Search SnapVault
            </h3>
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>
              Find events, photos, tags, and photographers
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

const ResultSection = ({ title, icon, total, children }) => (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "14px",
      }}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <h2
        style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "#e9d5ff",
          margin: 0,
        }}>
        {title}
      </h2>
      <span
        style={{
          background: "rgba(167,139,250,0.2)",
          color: "#a78bfa",
          borderRadius: "99px",
          padding: "2px 10px",
          fontSize: "12px",
          fontWeight: "600",
        }}>
        {total}
      </span>
    </div>
    {children}
  </div>
);

export default SearchPage;
