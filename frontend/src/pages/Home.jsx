import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import EventCard from "../components/EventCard";
import InfiniteFeed from "../components/InfiniteFeed";
import API from "../api/axios";

const Home = () => {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get("/events");
        setEvents(res.data);
      } catch (err) {
        console.error(err);
      }
      setEventsLoading(false);
    };
    fetchEvents();
  }, []);

  const allEvents = events.slice(0, 6);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-1)",
        color: "var(--text-1)",
        fontFamily: "Inter,sans-serif",
      }}>
      <Navbar />

      {/* ─── Hero Banner ──────────────────────────────── */}
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(139,92,246,0.08) 0%, transparent 100%)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "40px 24px 32px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "20%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "20%",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
              borderRadius: "99px",
              padding: "5px 14px",
              marginBottom: "16px",
            }}>
         
            <span
              style={{
                fontSize: "12px",
                color: "var(--accent-3)",
                fontWeight: "600",
              }}>
              Your club's media hub
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: "900",
              letterSpacing: "-0.035em",
              marginBottom: "12px",
              lineHeight: 1.15,
            }}>
            Capture Every{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
              Moment
            </span>
          </h1>
          <p
            style={{
              color: "var(--text-3)",
              fontSize: "16px",
              maxWidth: "480px",
              margin: "0 auto",
            }}>
            Explore events, browse your club's media gallery, and stay
            connected.
          </p>
        </div>
      </div>

      <div
        style={{ maxWidth: "1140px", margin: "0 auto", padding: "40px 24px" }}>
        {/* ─── SECTION 1: Events ──────────────────────── */}
        <section style={{ marginBottom: "56px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}>
            <div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  letterSpacing: "-0.02em",
                  color: "var(--text-1)",
                  margin: 0,
                }}>
                 Events
              </h2>
              <p
                style={{
                  color: "var(--text-4)",
                  fontSize: "13px",
                  margin: "4px 0 0",
                }}>
                All club events
              </p>
            </div>
            <Link
              to="/events"
              style={{
                color: "var(--accent-3)",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(192,132,252,0.2)",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(192,132,252,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}>
              View all →
            </Link>
          </div>

          {eventsLoading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 2fr))",
                gap: "20px",
              }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg-2)",
                    borderRadius: "20px",
                    border: "1px solid var(--border-subtle)",
                    overflow: "hidden",
                  }}>
                  <div
                    className="skeleton"
                    style={{ height: "3px", borderRadius: 0 }}
                  />
                  <div
                    style={{
                      padding: "28px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}>
                    <div
                      className="skeleton"
                      style={{ height: "20px", width: "30%" }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: "22px", width: "70%" }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: "14px", width: "100%" }}
                    />
                    <div
                      className="skeleton"
                      style={{ height: "14px", width: "80%" }}
                    />
                    <div
                      className="skeleton"
                      style={{
                        height: "36px",
                        width: "100%",
                        marginTop: "8px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : allEvents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                background: "var(--glass-bg)",
                borderRadius: "20px",
                border: "1px solid var(--border-subtle)",
              }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📅</div>
              <p style={{ color: "var(--text-3)", fontSize: "15px" }}>
                No events yet.
              </p>
              <Link
                to="/events"
                style={{
                  display: "inline-block",
                  marginTop: "16px",
                  color: "var(--accent-3)",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "600",
                }}>
                Browse all events →
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
              }}>
              {allEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* ─── Divider ─────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "var(--border-subtle)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg-2)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "99px",
              padding: "6px 16px",
            }}>
          
            <span
              style={{
                fontSize: "13px",
                color: "var(--text-3)",
                fontWeight: "600",
              }}>
              Latest Media
            </span>
          </div>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: "var(--border-subtle)",
            }}
          />
        </div>

        {/* ─── SECTION 2: Infinite Feed ────────────────── */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
            }}>
            <div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  letterSpacing: "-0.02em",
                  color: "var(--text-1)",
                  margin: 0,
                }}>
                 Recent Posts
              </h2>
              <p
                style={{
                  color: "var(--text-4)",
                  fontSize: "13px",
                  margin: "4px 0 0",
                }}>
                Photos from all events
              </p>
            </div>
            <Link
              to="/feed"
              style={{
                color: "var(--accent-3)",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(192,132,252,0.2)",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(192,132,252,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}>
              Full feed →
            </Link>
          </div>

          {/* Full width feed — no sidebar */}
          <div style={{ maxWidth: "680px" }}>
            <InfiniteFeed endpoint="/media/all" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
