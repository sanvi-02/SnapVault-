import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0b0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
      }}>
      {/* Soft blobs */}
      <div
        style={{
          position: "fixed",
          top: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-60px",
          left: "-60px",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "24px",
          padding: "52px 44px",
          width: "100%",
          maxWidth: "420px",
          boxShadow:
            "0 20px 50px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(16px)",
          position: "relative",
          zIndex: 1,
        }}>
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            width: "80%",
            height: "3px",
            background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
            borderRadius: "0 0 4px 4px",
          }}
        />

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              borderRadius: "16px",
              margin: "0 auto 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              boxShadow: "0 6px 20px rgba(139, 92, 246, 0.3)",
            }}>
            📸
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#f3f4f6",
              marginBottom: "6px",
              letterSpacing: "-0.025em",
            }}>
            Welcome Back
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "15px" }}>
            Sign in to continue to SnapVault
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "24px",
              color: "#f87171",
              fontSize: "14px",
              textAlign: "center",
            }}>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#9ca3af",
                marginBottom: "8px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1.5px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "13px 16px",
                color: "#f3f4f6",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8b5cf6";
                e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#9ca3af",
                marginBottom: "8px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1.5px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "13px 16px",
                color: "#f3f4f6",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8b5cf6";
                e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
              transition: "all 0.2s",
              opacity: loading ? 0.75 : 1,
              marginTop: "4px",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 8px 25px rgba(139, 92, 246, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.3)";
            }}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "28px",
            color: "#9ca3af",
            fontSize: "14px",
          }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#c084fc",
              textDecoration: "none",
              fontWeight: "600",
            }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
