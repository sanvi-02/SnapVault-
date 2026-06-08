import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

const UploadMedia = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [visibility, setVisibility] = useState("public");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();

  // Preview modal state
  const [previewSrc, setPreviewSrc] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openPreview = (file) => {
    setPreviewSrc(URL.createObjectURL(file));
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return setError("Please select at least one image");
    setLoading(true);
    setError("");

    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("eventId", eventId);
        formData.append("tags", JSON.stringify(tagArray));
        formData.append("visibility", visibility);

        await API.post("/media/upload", formData);

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      navigate(`/events/${eventId}`);
    } catch (err) {
      console.error("Upload error:", err.response?.data);
      setError(err.response?.data?.message || "Upload failed");
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
        color: "#f3f4f6",
        fontFamily: "Inter, sans-serif",
      }}>
      <Navbar />

      <div
        style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "800",
              color: "#f3f4f6",
              marginBottom: "8px",
              letterSpacing: "-0.025em",
            }}>
            Upload Photos
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "15px" }}>
            Add photos to this event media album
          </p>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
            position: "relative",
          }}>
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
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${
                  dragOver ? "#8b5cf6" : "rgba(255, 255, 255, 0.1)"
                }`,
                borderRadius: "16px",
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: dragOver
                  ? "rgba(139, 92, 246, 0.06)"
                  : "rgba(255, 255, 255, 0.01)",
                transition: "all 0.2s",
              }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📁</div>
              <p
                style={{
                  color: "#f3f4f6",
                  fontWeight: "600",
                  fontSize: "16px",
                  marginBottom: "6px",
                }}>
                Drag & drop images here
              </p>
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                or click to browse files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>

            {/* Preview Grid */}
            {files.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: "12px",
                }}>
                {files.map((file, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      borderRadius: "10px",
                      overflow: "hidden",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                    }}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      onClick={() => openPreview(file)}
                      style={{
                        width: "100%",
                        height: "90px",
                        objectFit: "cover",
                        display: "block",
                        cursor: "pointer",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "#ef4444")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "rgba(0,0,0,0.7)")
                      }>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
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
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. basketball, final, 2025"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Visibility Selector */}
            {user && ["Admin", "ClubMember"].includes(user.role) && (
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
                  Visibility
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "12px",
                      border: `1.5px solid ${
                        visibility === "public"
                          ? "#8b5cf6"
                          : "rgba(255, 255, 255, 0.08)"
                      }`,
                      background:
                        visibility === "public"
                          ? "rgba(139, 92, 246, 0.15)"
                          : "rgba(255, 255, 255, 0.02)",
                      color: visibility === "public" ? "#c084fc" : "#9ca3af",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}>
                    🌐 Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "12px",
                      border: `1.5px solid ${
                        visibility === "private"
                          ? "#8b5cf6"
                          : "rgba(255, 255, 255, 0.08)"
                      }`,
                      background:
                        visibility === "private"
                          ? "rgba(139, 92, 246, 0.15)"
                          : "rgba(255, 255, 255, 0.02)",
                      color: visibility === "private" ? "#c084fc" : "#9ca3af",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}>
                    🔒 Private
                  </button>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {loading && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}>
                  <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                    Uploading...
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: "#8b5cf6",
                      fontWeight: "600",
                    }}>
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    borderRadius: "99px",
                    height: "8px",
                  }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "99px",
                      background: "linear-gradient(90deg, #8b5cf6, #ec4899)",
                      width: `${uploadProgress}%`,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => navigate(`/events/${eventId}`)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1.5px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "15px",
                  color: "#d1d5db",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#ef4444";
                  e.target.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
                  e.target.style.color = "#d1d5db";
                }}>
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  background: loading
                    ? "rgba(139, 92, 246, 0.4)"
                    : "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading
                    ? "none"
                    : "0 4px 15px rgba(139, 92, 246, 0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                }}>
                {loading
                  ? `Uploading ${files.length} photo${
                      files.length > 1 ? "s" : ""
                    }...`
                  : `Upload ${files.length > 0 ? files.length + " " : ""}Photo${
                      files.length !== 1 ? "s" : ""
                    } →`}
              </button>
            </div>
          </form>

          {/* Preview Modal */}
          {isPreviewOpen && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                backdropFilter: "blur(8px)",
              }}
              onClick={closePreview}>
              <div
                style={{
                  position: "relative",
                  maxWidth: "90%",
                  maxHeight: "90%",
                }}
                onClick={(e) => e.stopPropagation()}>
                <img
                  src={previewSrc}
                  alt="preview"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 24px 50px rgba(0,0,0,0.7)",
                  }}
                />
                <button
                  onClick={closePreview}
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(0,0,0,0.75)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#ef4444")}
                  onMouseLeave={(e) =>
                    (e.target.style.background = "rgba(0,0,0,0.75)")
                  }>
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadMedia;
