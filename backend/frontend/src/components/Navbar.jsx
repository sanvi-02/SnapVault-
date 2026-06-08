import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import SearchBar from "./SearchBar";

const NAV_TABS = [
  { label: "Home", to: "/" },
  { label: "Feed", to: "/feed" },
  { label: "Events", to: "/events" },
  { label: "Tags", to: "/tags" },
  { label: "My Photos", to: "/my-photos" },
  { label: "Profile", to: "/profile" },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  return (
    <>
      <nav
        style={{
          background: "rgba(10,11,13,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0 24px",
          height: "62px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 200,
          boxShadow: "0 4px 40px rgba(0,0,0,0.35)",
        }}>
        {/* ── Left: Logo ───────────────────────────────── */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              background:
                "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              boxShadow: "0 0 18px rgba(139,92,246,0.35)",
            }}>
            📸
          </div>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "var(--text-1)",
              letterSpacing: "-0.03em",
              fontFamily: "Inter,sans-serif",
            }}>
            Snap<span style={{ color: "var(--accent-3)" }}>Vault</span>
          </span>
        </Link>

        {/* ── Center: Nav tabs ─────────────────────────── */}
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "4px",
            }}>
            {NAV_TABS.map((tab) => {
              const active = isActive(tab.to);
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                    padding: "6px 14px",
                    borderRadius: "9px",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "all 0.18s var(--ease-out)",
                    color: active ? "#fff" : "var(--text-3)",
                    background: active
                      ? "linear-gradient(135deg, var(--accent-1), var(--accent-2))"
                      : "transparent",
                    boxShadow: active
                      ? "0 4px 12px rgba(139,92,246,0.35)"
                      : "none",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "var(--text-1)";
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "var(--text-3)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}>
                  {/* <span style={{ fontSize: "14px", lineHeight: 1 }}>
                    {tab.icon}
                  </span> */}
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Right: Actions ───────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}>
          {user && <SearchBar />}
          {user && <NotificationBell />}

          {(user?.role === "Admin" || user?.role === "Photographer") && (
            <Link
              to="/create-event"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                color: "#fff",
                padding: "7px 16px",
                borderRadius: "9px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
                boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
                transition: "all 0.18s",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}>
              <span>＋</span> New Event
            </Link>
          )}

          {user && (
            <Link
              to="/profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.04)",
                padding: "5px 12px 5px 5px",
                borderRadius: "99px",
                border: "1px solid var(--border-subtle)",
                textDecoration: "none",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-medium)";
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  background:
                    "linear-gradient(135deg, var(--accent-1), var(--accent-2))",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "#fff",
                  fontWeight: "700",
                }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--text-1)",
                  fontWeight: "600",
                  maxWidth: "100px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {user?.name}
              </span>
            </Link>
          )}

          {user && (
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "1px solid var(--border-medium)",
                borderRadius: "9px",
                padding: "6px 14px",
                fontSize: "13px",
                color: "var(--text-3)",
                cursor: "pointer",
                transition: "all 0.18s",
                fontFamily: "Inter,sans-serif",
                fontWeight: "500",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ef4444";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-medium)";
                e.currentTarget.style.color = "var(--text-3)";
              }}>
              Sign out
            </button>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
