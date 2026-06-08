// src/components/NotificationBell.jsx
import { useState, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import API from "../api/axios";

const NotificationBell = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Fetch existing notifications on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get("/social/notifications");
        setNotifications(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handler = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };
    socket.on("new_notification", handler);
    return () => socket.off("new_notification", handler);
  }, [socket]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const handleOpen = async () => {
    setOpen((prev) => !prev);
    if (!open && unread > 0) {
      try {
        await API.patch("/social/notifications/read-all");
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const typeIcon = (type) => (type === "like" ? "❤️" : "💬");

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        style={{
          background: "none",
          border: "1.5px solid rgba(167,139,250,0.3)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontSize: "18px",
          transition: "all 0.2s",
          backgroundColor: open ? "rgba(167,139,250,0.1)" : "transparent",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "rgba(167,139,250,0.1)")
        }
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "transparent";
        }}>
        🔔
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-3px",
              right: "-3px",
              background: "linear-gradient(135deg, #f43f5e, #fb7185)",
              color: "#fff",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              fontSize: "10px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Georgia, serif",
              border: "2px solid #fff",
              boxShadow: "0 2px 6px rgba(244,63,94,0.4)",
            }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "50px",
            width: "340px",
            background: "#fff",
            borderRadius: "18px",
            boxShadow: "0 12px 40px rgba(167,139,250,0.2)",
            border: "1px solid rgba(167,139,250,0.2)",
            zIndex: 1000,
            overflow: "hidden",
            animation: "dropIn 0.2s ease",
          }}>
          {/* Header */}
          <div
            style={{
              padding: "16px 20px 12px",
              borderBottom: "1px solid #f3f0ff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <span
              style={{
                fontWeight: "700",
                color: "#1e1b4b",
                fontSize: "15px",
                fontFamily: "Georgia, serif",
              }}>
              Notifications
            </span>
            {unread === 0 && (
              <span style={{ fontSize: "11px", color: "#a78bfa" }}>
                All caught up ✓
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "14px",
                  fontFamily: "Georgia, serif",
                }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid #f9f8ff",
                    background: n.read ? "#fff" : "rgba(167,139,250,0.05)",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#faf8ff")
                  }
                  onMouseLeave={(e) =>
                  (e.currentTarget.style.background = n.read
                    ? "#fff"
                    : "rgba(167,139,250,0.05)")
                  }>
                  {/* Icon */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: n.type === "like" ? "#fff0f3" : "#f0f4ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}>
                    {typeIcon(n.type)}
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#1e1b4b",
                        fontFamily: "Georgia, serif",
                        lineHeight: "1.5",
                      }}>
                      {n.message}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "11px",
                        color: "#c4b5fd",
                      }}>
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {/* Unread dot */}
                  {!n.read && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#a78bfa",
                        marginTop: "4px",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
