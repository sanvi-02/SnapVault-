import { Link } from "react-router-dom";

const categoryMeta = {
  Sports: {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.25)",
   
  },
  Cultural: {
    color: "#a855f7",
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.25)",

  },
  Technical: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.25)",
   
  },
  Other: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.25)",
  
  },
};

const EventCard = ({ event, compact = false }) => {
  const cat = categoryMeta[event.category] || categoryMeta.Other;
  const dateStr = new Date(event.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      to={`/events/${event._id}`}
      style={{ textDecoration: "none", display: "block" }}>
      <div
        className="event-card"
        style={{
          background: "var(--bg-2)",
          borderRadius: compact ? "16px" : "20px",
          border: "1px solid var(--border-subtle)",
          overflow: "hidden",
          transition: "all 0.28s var(--ease-out)",
          cursor: "pointer",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.borderColor = `${cat.color}55`;
          e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px ${cat.color}22`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.boxShadow = "none";
        }}>
        {/* Top color bar */}
        <div
          style={{
            height: "3px",
            background: `linear-gradient(90deg, ${cat.color}, transparent)`,
          }}
        />

        <div style={{ padding: compact ? "20px" : "28px" }}>
          {/* Header row — only category badge */}
          <div style={{ marginBottom: "14px" }}>
            <span
              style={{
                background: cat.bg,
                color: cat.color,
                border: `1px solid ${cat.border}`,
                borderRadius: "6px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
              {cat.icon} {event.category}
            </span>
          </div>

          {/* Event name */}
          <h3
            style={{
              fontSize: compact ? "16px" : "20px",
              fontWeight: "700",
              color: "var(--text-1)",
              marginBottom: "8px",
              letterSpacing: "-0.015em",
              lineHeight: 1.35,
            }}>
            {event.name}
          </h3>

          {/* Description */}
          {!compact && (
            <p
              style={{
                color: "var(--text-3)",
                fontSize: "14px",
                lineHeight: "1.65",
                marginBottom: "20px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
              {event.description || "No description provided."}
            </p>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: compact ? "12px" : "16px",
              borderTop: "1px solid var(--border-subtle)",
              marginTop: compact ? "12px" : "0",
            }}>
            {/* Date chip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--bg-3)",
                borderRadius: "8px",
                padding: "5px 10px",
                border: "1px solid var(--border-subtle)",
              }}>
              <span style={{ fontSize: "13px" }}>📅</span>
              <span
                style={{
                  color: "var(--text-2)",
                  fontSize: "12px",
                  fontWeight: "600",
                }}>
                {dateStr}
              </span>
            </div>

            <span
              style={{
                color: cat.color,
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "gap 0.2s",
              }}>
              View Album →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
