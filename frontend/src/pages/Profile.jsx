import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const roleMeta = {
  Admin: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
    icon: "👑",
  },
  Photographer: {
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.25)",
    icon: "📷",
  },
  ClubMember: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.25)",
    icon: "🎖️",
  },
  Viewer: {
    color: "#9ca3af",
    bg: "rgba(156,163,175,0.1)",
    border: "rgba(156,163,175,0.2)",
    icon: "👁️",
  },
};

const StatCard = ({ label, value, icon }) => (
  <div
    style={{
      background: "var(--bg-2)",
      borderRadius: "14px",
      border: "1px solid var(--border-subtle)",
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      flex: 1,
      minWidth: "100px",
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "var(--border-medium)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--border-subtle)";
      e.currentTarget.style.transform = "translateY(0)";
    }}>
    <span style={{ fontSize: "22px" }}>{icon}</span>
    <span
      style={{
        fontSize: "24px",
        fontWeight: "800",
        color: "var(--text-1)",
        lineHeight: 1.2,
      }}>
      {value}
    </span>
    <span
      style={{ fontSize: "12px", color: "var(--text-4)", fontWeight: "500" }}>
      {label}
    </span>
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myMedia, setMyMedia] = useState([]);
  const [events, setEvents] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [tab, setTab] = useState("media"); // "media" | "events" | (admin) "manage"
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // State for tracking which item's dropdown is open
  const [activeDropdown, setActiveDropdown] = useState(null);

  const isAdmin = user?.role === "Admin";
  const rm = roleMeta[user?.role] || roleMeta.Viewer;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mediaRes, eventsRes] = await Promise.all([
          API.get("/media/my"),
          API.get("/events"),
        ]);
        setMyMedia(mediaRes.data || []);
        setEvents(eventsRes.data || []);
      } catch (err) {
        console.error(err);
      }
      setMediaLoading(false);
    };
    fetchData();
  }, []);

  // Dropdown ke bahar click karne par use close karne ke liye handler
  useEffect(() => {
    const handleOutsideClick = () => setActiveDropdown(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Delete Media Function
  const handleDeleteMedia = async (mediaId, e) => {
    e.stopPropagation(); // Prevents opening the lightbox when clicking delete
    if (window.confirm("Are you sure you want to delete this photo?")) {
      try {
        await API.delete(`/media/${mediaId}`);
        setMyMedia(myMedia.filter((item) => item._id !== mediaId));
        setActiveDropdown(null);
      } catch (err) {
        console.error("Failed to delete media:", err);
        alert("Something went wrong while deleting.");
      }
    }
  };

  const totalLikes = myMedia.reduce(
    (acc, m) => acc + (m.likes?.length || 0),
    0
  );
  const totalDownloads = myMedia.reduce(
    (acc, m) => acc + (m.downloadCount || 0),
    0
  );

  const tabs = [
    { key: "media", label: "My Media", icon: "📸" },
    { key: "events", label: "Events", icon: "🎉" },
    ...(isAdmin ? [{ key: "manage", label: "Admin Panel", icon: "⚙️" }] : []),
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-1)",
        color: "var(--text-1)",
        fontFamily: "Inter,sans-serif",
      }}>
      <Navbar />

      {/* ── Cover Banner ──────────────────────────────── */}
      <div
        style={{
          height: "200px",
          background: `linear-gradient(135deg, ${rm.color}22 0%, rgba(236,72,153,0.15) 50%, rgba(59,130,246,0.1) 100%)`,
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: `${60 + i * 30}px`,
              height: `${60 + i * 30}px`,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${rm.color}18 0%, transparent 70%)`,
              top: `${10 + (i % 3) * 30}%`,
              left: `${5 + i * 16}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div
        style={{ maxWidth: "960px", margin: "0 auto", padding: "0 24px 64px" }}>
        {/* ── Profile Header ───────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "24px",
            marginTop: "-52px",
            marginBottom: "32px",
            flexWrap: "wrap",
          }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              background: `linear-gradient(135deg, var(--accent-1), var(--accent-2))`,
              borderRadius: "24px",
              border: "4px solid var(--bg-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "42px",
              fontWeight: "800",
              color: "#fff",
              flexShrink: 0,
              boxShadow: "var(--shadow-md)",
              position: "relative",
              zIndex: 1,
            }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, paddingBottom: "4px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  letterSpacing: "-0.025em",
                  color: "var(--text-1)",
                  margin: 0,
                }}>
                {user?.name}
              </h1>
              <span
                style={{
                  background: rm.bg,
                  color: rm.color,
                  border: `1px solid ${rm.border}`,
                  borderRadius: "8px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                {rm.icon} {user?.role}
              </span>
            </div>
            <p
              style={{
                color: "var(--text-3)",
                fontSize: "14px",
                margin: "4px 0 0",
              }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "32px",
            flexWrap: "wrap",
          }}>
          <StatCard icon="📸" label="Uploads" value={myMedia.length} />
          <StatCard icon="❤️" label="Likes received" value={totalLikes} />
          <StatCard icon="⬇️" label="Downloads" value={totalDownloads} />
          <StatCard icon="🎉" label="Total events" value={events.length} />
        </div>

        {/* ── Tabs ─────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "12px",
            padding: "4px",
            marginBottom: "28px",
            width: "fit-content",
          }}>
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                background:
                  tab === key
                    ? "linear-gradient(135deg, var(--accent-1), var(--accent-2))"
                    : "transparent",
                color: tab === key ? "#fff" : "var(--text-3)",
                border: "none",
                cursor: "pointer",
                padding: "7px 18px",
                borderRadius: "9px",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.18s",
                fontFamily: "Inter,sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow:
                  tab === key ? "0 4px 12px rgba(139,92,246,0.3)" : "none",
                whiteSpace: "nowrap",
              }}>
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>

        {/* ── Tab: My Media Gallery ───────────────────── */}
        {tab === "media" && (
          <div>
            {mediaLoading ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "12px",
                }}>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: "200px", borderRadius: "14px" }}
                  />
                ))}
              </div>
            ) : myMedia.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "64px 40px",
                  background: "var(--glass-bg)",
                  borderRadius: "20px",
                  border: "1px solid var(--border-subtle)",
                }}>
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "14px",
                    animation: "float 3s ease-in-out infinite",
                  }}>
                  🖼️
                </div>
                <p
                  style={{
                    color: "var(--text-2)",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}>
                  No uploads yet
                </p>
                <p
                  style={{
                    color: "var(--text-4)",
                    fontSize: "13px",
                    marginTop: "6px",
                  }}>
                  Go to an event and upload your first photo!
                </p>
              </div>
            ) : (
              <>
                <p
                  style={{
                    color: "var(--text-4)",
                    fontSize: "12px",
                    marginBottom: "16px",
                    fontWeight: "500",
                  }}>
                  {myMedia.length} {myMedia.length === 1 ? "photo" : "photos"}{" "}
                  uploaded
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "10px",
                  }}>
                  {myMedia.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        position: "relative",
                        borderRadius: "12px",
                        overflow: "visible",
                        aspectRatio: "1", // Changed overflow to visible for dropdown popups
                        cursor: "pointer",
                        background: "var(--bg-3)",
                        border: "1px solid var(--border-subtle)",
                        transition: "all 0.2s",
                      }}
                      onClick={() => setLightboxSrc(item.url)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.03)";
                        e.currentTarget.style.boxShadow = "var(--shadow-md)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      {/* Image container with hidden overflow to keep border-radius clean */}
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "11px",
                          overflow: "hidden",
                          position: "relative",
                        }}>
                        <img
                          src={item.url}
                          alt="media"
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />

                        {/* Hover overlay for details */}
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0)",
                            display: "flex",
                            alignItems: "flex-end",
                            padding: "10px",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "rgba(0,0,0,0.45)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "rgba(0,0,0,0)")
                          }>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#fff",
                                background: "rgba(0,0,0,0.5)",
                                borderRadius: "99px",
                                padding: "2px 8px",
                                fontWeight: "600",
                              }}>
                              ❤️ {item.likes?.length || 0}
                            </span>
                            {item.visibility === "private" && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#f43f5e",
                                  background: "rgba(0,0,0,0.5)",
                                  borderRadius: "99px",
                                  padding: "2px 8px",
                                  fontWeight: "600",
                                }}>
                                🔒
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Three Dots Action Menu Button ── */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Lightbox open hone se rokne ke liye
                          setActiveDropdown(
                            activeDropdown === item._id ? null : item._id
                          );
                        }}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          background: "rgba(0, 0, 0, 0.6)",
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "50%",
                          width: "26px",
                          height: "26px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          cursor: "pointer",
                          zIndex: 10,
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(0, 0, 0, 0.8)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(0, 0, 0, 0.6)")
                        }>
                        ⋮
                      </button>

                      {/* ── Dropdown Menu Menu ── */}
                      {activeDropdown === item._id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "38px",
                            right: "8px",
                            background: "var(--bg-2, #1f2937)",
                            border: "1px solid var(--border-subtle, #374151)",
                            borderRadius: "8px",
                            padding: "4px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                            zIndex: 20,
                            minWidth: "110px",
                          }}
                          onClick={(e) => e.stopPropagation()} // Dropdown click par lightbox prevent karne ke liye
                        >
                          <button
                            onClick={(e) => handleDeleteMedia(item._id, e)}
                            style={{
                              width: "100%",
                              padding: "6px 12px",
                              background: "transparent",
                              border: "none",
                              color: "#ef4444",
                              fontSize: "12px",
                              fontWeight: "600",
                              textAlign: "left",
                              cursor: "pointer",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "rgba(239, 68, 68, 0.1)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }>
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Events ─────────────────────────────── */}
        {tab === "events" && (
          <div>
            <p
              style={{
                color: "var(--text-4)",
                fontSize: "12px",
                marginBottom: "16px",
                fontWeight: "500",
              }}>
              {events.length} total events in the system
            </p>
            {events.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "64px 40px",
                  background: "var(--glass-bg)",
                  borderRadius: "20px",
                  border: "1px solid var(--border-subtle)",
                }}>
                <div style={{ fontSize: "48px", marginBottom: "14px" }}>🎉</div>
                <p
                  style={{
                    color: "var(--text-2)",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}>
                  No events yet
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "14px",
                }}>
                {events.slice(0, 9).map((event) => (
                  <Link
                    key={event._id}
                    to={`/events/${event._id}`}
                    style={{
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      background: "var(--bg-2)",
                      borderRadius: "12px",
                      border: "1px solid var(--border-subtle)",
                      padding: "14px 16px",
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-medium)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-subtle)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        flexShrink: 0,
                        background:
                          "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                      }}>
                      🎉
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "var(--text-1)",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                        {event.name}
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-4)",
                          margin: "2px 0 0",
                        }}>
                        {new Date(event.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      style={{ color: "var(--accent-3)", fontSize: "16px" }}>
                      →
                    </span>
                  </Link>
                ))}
                {events.length > 9 && (
                  <Link
                    to="/events"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      color: "var(--accent-3)",
                      background: "var(--bg-2)",
                      borderRadius: "12px",
                      border: "1px dashed var(--border-medium)",
                      padding: "14px 16px",
                      fontSize: "13px",
                      fontWeight: "600",
                      transition: "all 0.18s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(139,92,246,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--bg-2)")
                    }>
                    +{events.length - 9} more events →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Admin Manage (Admin only) ───────────── */}
        {tab === "manage" && isAdmin && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p
              style={{
                color: "var(--text-3)",
                fontSize: "14px",
                marginBottom: "4px",
              }}>
              Administrative tools and shortcuts
            </p>

            {[
              {
                title: "Admin Panel",
                desc: "Full admin dashboard — manage users, media, clubs",
                icon: "⚙️",
                to: "/admin",
                accent: "#f59e0b",
                bg: "rgba(245,158,11,0.1)",
              },
              {
                title: "Create Event",
                desc: "Add a new event to the system",
                icon: "➕",
                to: "/create-event",
                accent: "var(--accent-1)",
                bg: "rgba(139,92,246,0.1)",
              },
              {
                title: "Browse All Media",
                desc: "View and moderate all uploaded media",
                icon: "🖼️",
                to: "/feed",
                accent: "var(--accent-2)",
                bg: "rgba(236,72,153,0.08)",
              },
              {
                title: "Browse Events",
                desc: "View all events and their media albums",
                icon: "🎉",
                to: "/events",
                accent: "#22c55e",
                bg: "rgba(34,197,94,0.08)",
              },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  textDecoration: "none",
                  background: action.bg,
                  border: `1px solid ${action.accent}22`,
                  borderRadius: "16px",
                  padding: "20px 24px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: `${action.accent}18`,
                    border: `1px solid ${action.accent}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}>
                  {action.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: "700",
                      color: "var(--text-1)",
                      margin: 0,
                    }}>
                    {action.title}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-3)",
                      margin: "2px 0 0",
                    }}>
                    {action.desc}
                  </p>
                </div>
                <span style={{ color: action.accent, fontSize: "20px" }}>
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────── */}
      {lightboxSrc && (
        <div
          onClick={() => setLightboxSrc(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.2s ease",
            cursor: "zoom-out",
          }}>
          <img
            src={lightboxSrc}
            alt="preview"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "var(--shadow-lg)",
              animation: "scaleIn 0.25s var(--ease-spring)",
            }}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            style={{
              position: "absolute",
              top: "20px",
              right: "24px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
              color: "#fff",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.18)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }>
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
