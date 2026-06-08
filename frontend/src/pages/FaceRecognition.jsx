// FaceRecognition.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function FaceRecognition() {
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [searched, setSearched] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [threshold, setThreshold] = useState(0.60); // Hardcoded to be more forgiving
  const [imgTimestamp, setImgTimestamp] = useState(Date.now());
  
  const fileInputRef = useRef();

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (message?.type === "success") {
      const t = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [message]);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await api.get("/api/face/status");
      setStatus(res.data);
      setImgTimestamp(Date.now());
    } catch {
      setMessage({
        type: "error",
        text: "Could not fetch status. Please log in again.",
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setMessage({ type: "error", text: "File too large. Max 15 MB." });
      return;
    }
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setMessage(null);
  };

  const handleRegister = async () => {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a selfie first." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("selfie", selectedFile);

      await api.post("/api/face/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({
        type: "success",
        text: "Face registered! You can now search your photos.",
      });
      setPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchStatus();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Registration failed. Please try another photo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFindPhotos = async () => {
    setSearching(true);
    setPhotos([]);
    setSearched(false);
    setMessage(null);
    try {
      const res = await api.get(`/api/face/myphotos?threshold=${threshold}`);
      setPhotos(res.data.photos || []);
      setSearched(true);

      if (res.data.unprocessedCount > 0) {
        setMessage({
          type: "info",
          text: `${res.data.unprocessedCount} photo(s) are still being indexed and may appear later.`,
        });
      } else if (res.data.count === 0) {
        setMessage({
          type: "info",
          text: "No matching photos found. Try a different selfie or wait for more photos to be indexed.",
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Search failed. Please try again.",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteFace = async () => {
    if (!window.confirm("Remove your face registration? You won't be able to find your photos.")) return;
    try {
      await api.delete("/api/face/register");
      setStatus({ faceIndexed: false, selfieUrl: null });
      setPhotos([]);
      setSearched(false);
      setMessage({ type: "success", text: "Face registration removed." });
    } catch {
      setMessage({ type: "error", text: "Failed to remove. Try again." });
    }
  };

  if (statusLoading) {
    return (
      <div style={styles.page}>
        <Navbar />
        <div style={styles.loadingCenter}>
          <div style={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <Navbar />
      
      <div style={styles.container}>
        {/* Central Hero Section */}
        <div style={styles.hero}>
          <h2 style={styles.title}>Find My Photos</h2>
          <p style={styles.subtitle}>
            Discover every moment you were a part of using facial recognition.
          </p>

          {message && (
            <div style={{ ...styles.message, ...styles[`message_${message.type}`] }}>
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} style={styles.messageClose}>✕</button>
            </div>
          )}

          {status?.indexingProgress && (status.indexingProgress.pending > 0) && (
            <div style={styles.indexProgress}>
              <div
                style={{
                  ...styles.indexBar,
                  width: `${(status.indexingProgress.indexed / Math.max(status.indexingProgress.total, 1)) * 100}%`,
                }}
              />
              <span style={styles.indexText}>
                {status.indexingProgress.indexed} / {status.indexingProgress.total} indexed
              </span>
            </div>
          )}

          {!status?.faceIndexed ? (
            // NOT REGISTERED FLOW
            <div style={styles.actionArea}>
              <div
                style={styles.dropzone}
                onClick={() => fileInputRef.current.click()}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#8b5cf6"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"}
              >
                {preview ? (
                  <img src={preview} alt="Preview" style={styles.previewImg} />
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                    <p style={{ color: "#f3f4f6", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
                      Upload a Selfie to Begin
                    </p>
                    <span style={{ color: "#9ca3af", fontSize: 14 }}>
                      Clear, front-facing photo · Max 15 MB
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              {preview && (
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  style={styles.btnPrimaryLg}
                >
                  {loading ? (
                    <><span style={styles.spinnerSm} /> Processing...</>
                  ) : (
                    "Confirm & Register Face"
                  )}
                </button>
              )}
            </div>
          ) : (
            // REGISTERED FLOW
            <div style={styles.actionArea}>
              {/* Show tiny preview of their face */}
              <div style={styles.profileBadge}>
                <img src={`${status.selfieUrl}?t=${imgTimestamp}`} alt="Your face" style={styles.profileImg} />
                {preview && (
                  <>
                    <span style={{ margin: "0 8px", color: "#9ca3af" }}>➜</span>
                    <img src={preview} alt="New photo preview" style={styles.profileImg} />
                  </>
                )}
                <div style={styles.profileStatus}>
                  <span style={{ color: "#10b981", fontSize: 14, fontWeight: 700 }}>
                    {preview ? "Pending Update..." : "✅ Face Active"}
                  </span>
                  {!status.hasDescriptor && !preview && (
                    <span style={{ color: "#f87171", fontSize: 12, display: "block" }}>⚠️ Descriptor missing — Please update</span>
                  )}
                </div>
              </div>

              {/* Primary Search Action */}
              <button
                onClick={handleFindPhotos}
                disabled={searching}
                style={styles.btnPrimaryLg}
              >
                {searching ? (
                  <><span style={styles.spinnerSm} /> Scanning Photos...</>
                ) : (
                  "Search My Photos"
                )}
              </button>

              {/* Settings Actions (Always Visible) */}
              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                {preview ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleRegister} disabled={loading} style={styles.btnPrimary}>
                      {loading ? "Saving..." : "Save New Photo"}
                    </button>
                    <button onClick={() => { setPreview(null); setSelectedFile(null); }} style={styles.btnSecondary}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => fileInputRef.current.click()} style={styles.btnSecondary}>
                      Update Photo
                    </button>
                    <button onClick={handleDeleteFace} style={styles.btnDanger}>
                      Remove Face
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Section (Instagram-style Grid) */}
        {searched && (
          <div style={styles.resultsContainer}>
            <h3 style={styles.resultsTitle}>
              {photos.length > 0
                ? `${photos.length} Matches Found`
                : "No matches found"}
            </h3>
            
            {photos.length > 0 && (
              <div style={styles.grid}>
                {photos.map((photo) => (
                  <PhotoCard key={photo._id} photo={photo} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Instagram-Style Photo Card Component ─────────────────────────────────────
function PhotoCard({ photo }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={styles.photoCard}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={photo.url}
        alt={photo.caption || "Event photo"}
        style={{
          ...styles.photoImg,
          transform: isHovered ? "scale(1.05)" : "scale(1)",
        }}
        loading="lazy"
      />
      <div style={{
        ...styles.overlay,
        opacity: isHovered ? 1 : 0,
      }}>
        <p style={styles.overlayEvent}>{photo.eventName || "Event"}</p>
        {photo.similarityScore != null && (
           <span style={{
             ...styles.matchBadge,
             background: photo.similarityScore > 0.8 ? "rgba(16, 185, 129, 0.9)" 
                       : photo.similarityScore > 0.6 ? "rgba(245, 158, 11, 0.9)" 
                       : "rgba(59, 130, 246, 0.9)",
           }}>
             {Math.round(photo.similarityScore * 100)}% match
           </span>
        )}
      </div>
    </div>
  );
}

// ── Inline Styles ────────────────────────────────────────────────────────────
const styles = {
  page: { minHeight: "100vh", background: "#0a0b0d", color: "#f3f4f6", fontFamily: "Inter, sans-serif" },
  container: { maxWidth: 1000, margin: "0 auto", padding: "40px 24px" },
  loadingCenter: {
    display: "flex",
    justifyContent: "center",
    paddingTop: 100,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  spinnerSm: {
    width: 16,
    height: 16,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  
  // Hero Layout
  hero: {
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: 24,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "48px 24px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    marginBottom: 40,
    backdropFilter: "blur(12px)",
  },
  title: { fontSize: 32, fontWeight: 800, color: "#f3f4f6", margin: "0 0 12px", letterSpacing: "-0.02em" },
  subtitle: { color: "#9ca3af", fontSize: 16, margin: "0 0 32px" },
  
  actionArea: {
    maxWidth: 500,
    margin: "0 auto",
  },

  // Dropzone
  dropzone: {
    border: "2px dashed rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: "40px 20px",
    cursor: "pointer",
    background: "rgba(255, 255, 255, 0.01)",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    marginBottom: 20,
  },
  previewImg: {
    maxHeight: 180,
    maxWidth: "100%",
    borderRadius: 12,
    objectFit: "cover",
    boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
  },

  // Profile Badge
  profileBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 16,
    background: "rgba(255,255,255,0.03)",
    padding: "12px 24px",
    borderRadius: 99,
    border: "1px solid rgba(255,255,255,0.05)",
    marginBottom: 32,
  },
  profileImg: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #8b5cf6",
  },
  profileStatus: {
    textAlign: "left",
  },

  // Buttons
  btnPrimaryLg: {
    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "16px 32px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "all 0.2s",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
  },
  btnPrimary: {
    background: "#8b5cf6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.2)",
    transition: "opacity 0.2s",
  },
  btnSecondary: {
    background: "rgba(255, 255, 255, 0.08)",
    color: "#f3f4f6",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s",
  },
  btnDanger: {
    background: "transparent",
    color: "#ef4444",
    border: "1px solid #ef4444",
    borderRadius: 8,
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s",
  },

  // Messages
  message: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    borderRadius: 12,
    marginBottom: 24,
    fontSize: 14,
    fontWeight: 500,
  },
  message_success: { background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" },
  message_error: { background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" },
  message_info: { background: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.3)" },
  messageClose: { background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16 },
 
  // Progress Bar
  indexProgress: {
    position: "relative",
    height: 6,
    background: "rgba(255, 255, 255, 0.08)",
    borderRadius: 99,
    marginBottom: 24,
    overflow: "hidden",
    maxWidth: 300,
    margin: "0 auto 24px",
  },
  indexBar: {
    height: "100%",
    background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
    borderRadius: 99,
    transition: "width 0.4s",
  },
  indexText: {
    position: "absolute",
    right: 0,
    top: 8,
    fontSize: 11,
    color: "#9ca3af",
  },

  // Results Grid (Instagram Style)
  resultsContainer: {
    marginTop: 40,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#f3f4f6",
    marginBottom: 24,
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    paddingBottom: 16,
    letterSpacing: "-0.01em",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  photoCard: {
    position: "relative",
    aspectRatio: "1", // Perfect square
    overflow: "hidden",
    background: "#12141c",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
  },
  photoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.4s ease",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    transition: "opacity 0.25s ease",
  },
  overlayEvent: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    margin: "0 0 8px",
    textAlign: "center",
    padding: "0 12px",
  },
  matchBadge: {
    display: "inline-block",
    fontSize: 12,
    padding: "4px 12px",
    borderRadius: 99,
    color: "#fff",
    fontWeight: 700,
    backdropFilter: "blur(4px)",
  },
};
