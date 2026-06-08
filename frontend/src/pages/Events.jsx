import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import EventCard from "../components/EventCard";
import API from "../api/axios";

const CATEGORIES = ["All", "Sports", "Cultural", "Technical", "Other"];

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get("/events");
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filtered = filter === "All"
    ? events
    : events.filter((e) => e.category === filter);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-1)", color: "var(--text-1)", fontFamily: "Inter,sans-serif" }}>
      <Navbar />

      {/* ── Page Header ─────────────────────────────── */}
      <div style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "linear-gradient(180deg, rgba(245,158,11,0.06) 0%, transparent 100%)",
        padding: "36px 24px 28px",
      }}>
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(245,158,11,0.1)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "99px", padding: "4px 12px",
            marginBottom: "12px",
          }}>
        
            <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Events
            </span>
          </div>
          <h1 style={{
            fontSize: "32px", fontWeight: "900",
            letterSpacing: "-0.03em", color: "var(--text-1)",
            margin: 0, lineHeight: 1.2,
          }}>
            All Events
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: "14px", marginTop: "8px" }}>
            {events.length} event{events.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* ── Category filter ──────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          flexWrap: "wrap", marginBottom: "32px",
        }}>
          <span style={{ fontSize: "12px", color: "var(--text-4)", fontWeight: "600", marginRight: "4px" }}>Filter:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                background: filter === cat ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.03)",
                color: filter === cat ? "#c084fc" : "var(--text-3)",
                border: `1px solid ${filter === cat ? "rgba(192,132,252,0.3)" : "var(--border-subtle)"}`,
                borderRadius: "8px", padding: "6px 16px",
                fontSize: "12px", fontWeight: "600",
                cursor: "pointer", transition: "all 0.15s",
                fontFamily: "Inter,sans-serif",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Events Grid ──────────────────────────────── */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ background: "var(--bg-2)", borderRadius: "20px", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
                <div className="skeleton" style={{ height: "3px", borderRadius: 0 }} />
                <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="skeleton" style={{ height: "22px", width: "35%" }} />
                    <div className="skeleton" style={{ height: "22px", width: "22%" }} />
                  </div>
                  <div className="skeleton" style={{ height: "24px", width: "75%" }} />
                  <div className="skeleton" style={{ height: "13px", width: "100%" }} />
                  <div className="skeleton" style={{ height: "13px", width: "60%" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                    <div className="skeleton" style={{ height: "32px", width: "40%" }} />
                    <div className="skeleton" style={{ height: "16px", width: "25%" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 40px",
            background: "var(--glass-bg)", borderRadius: "24px",
            border: "1px solid var(--border-subtle)",
            animation: "fadeIn 0.3s ease",
          }}>
            <div style={{ fontSize: "52px", marginBottom: "16px", animation: "float 3s ease-in-out infinite" }}>🎉</div>
            <p style={{ color: "var(--text-2)", fontSize: "17px", fontWeight: "600", marginBottom: "6px" }}>
              {filter !== "All" ? `No ${filter} events found` : "No events yet"}
            </p>
            <p style={{ color: "var(--text-4)", fontSize: "14px" }}>
              {filter !== "All" ? "Try selecting a different category." : "Events will appear here once created."}
            </p>
            {filter !== "All" && (
              <button
                onClick={() => setFilter("All")}
                style={{
                  marginTop: "20px", padding: "8px 20px",
                  background: "var(--bg-3)", border: "1px solid var(--border-medium)",
                  borderRadius: "9px", color: "var(--text-2)", cursor: "pointer",
                  fontSize: "13px", fontWeight: "600", fontFamily: "Inter,sans-serif",
                  transition: "all 0.15s",
                }}
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px",
            animation: "fadeIn 0.3s ease",
          }}>
            {filtered.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
