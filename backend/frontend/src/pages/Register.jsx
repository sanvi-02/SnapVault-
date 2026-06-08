import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Viewer",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/register", form);
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1.5px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "13px 16px",
    color: "#f3f4f6",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s",
    fontFamily: "Inter, sans-serif",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#9ca3af",
    marginBottom: "8px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = "#8b5cf6";
    e.target.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.15)";
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
    e.target.style.boxShadow = "none";
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
      <div
        style={{
          position: "fixed",
          top: "-80px",
          left: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-60px",
          right: "-60px",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "24px",
          padding: "48px 44px",
          width: "100%",
          maxWidth: "420px",
          boxShadow:
            "0 20px 50px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(16px)",
          position: "relative",
          zIndex: 1,
        }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            width: "80%",
            height: "3px",
            background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
            borderRadius: "0 0 4px 4px",
          }}
        />

        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#f3f4f6",
              marginBottom: "6px",
              letterSpacing: "-0.025em",
            }}>
            Create Account
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "15px" }}>
            Join the SnapVault community
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "20px",
              color: "#f87171",
              fontSize: "14px",
              textAlign: "center",
            }}>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <label style={labelStyle}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{ ...inputStyle, cursor: "pointer" }}
              onFocus={handleFocus}
              onBlur={handleBlur}>
              <option value="Viewer">Viewer</option>
              <option value="ClubMember">Club Member</option>
              <option value="Photographer">Photographer</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "6px",
              boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
              transition: "all 0.2s",
              opacity: loading ? 0.75 : 1,
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
            {loading ? "Creating..." : "Create Account →"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "#9ca3af",
            fontSize: "14px",
          }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#c084fc",
              textDecoration: "none",
              fontWeight: "600",
            }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
