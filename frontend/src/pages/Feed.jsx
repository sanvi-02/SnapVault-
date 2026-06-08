import Navbar from "../components/Navbar";
import InfiniteFeed from "../components/InfiniteFeed";

const Feed = () => {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-1)", color: "var(--text-1)", fontFamily: "Inter,sans-serif" }}>
      <Navbar />

      {/* Page header */}
      <div style={{
        borderBottom: "1px solid var(--border-subtle)",
        background: "linear-gradient(180deg, rgba(139,92,246,0.05) 0%, transparent 100%)",
        padding: "36px 24px 28px",
      }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "99px", padding: "4px 12px",
            marginBottom: "12px",
          }}>
        
            <span style={{ fontSize: "11px", color: "var(--accent-3)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Media Feed
            </span>
          </div>
          <h1 style={{
            fontSize: "32px", fontWeight: "900",
            letterSpacing: "-0.03em", color: "var(--text-1)", margin: 0,
            lineHeight: 1.2,
          }}>
            Your Feed
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: "14px", marginTop: "8px" }}>
            All media uploaded across events — scroll and discover.
          </p>
        </div>
      </div>

      {/* Feed content — centered single column */}
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 24px 64px" }}>
        <InfiniteFeed endpoint="/media/all" />
      </div>
    </div>
  );
};

export default Feed;
