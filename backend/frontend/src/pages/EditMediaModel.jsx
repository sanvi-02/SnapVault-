// EditMediaModal.jsx
// Usage: <EditMediaModal media={mediaObj} onClose={() => setEditing(null)} onSaved={(updated) => updateListItem(updated)} />
import { useState, useRef } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function EditMediaModal({ media, onClose, onSaved }) {
  const [caption, setCaption] = useState(media.caption || "");
  const [tags, setTags] = useState((media.tags || []).join(", "));
  const [newFile, setNewFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setMessage({ type: "error", text: "File too large. Max 20 MB." });
      return;
    }
    setNewFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("caption", caption.trim());

      // Parse tags: comma or space separated
      const parsedTags = tags
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      formData.append("tags", JSON.stringify(parsedTags));

      if (newFile) {
        formData.append("file", newFile);
      }

      const res = await api.patch(`/api/media/${media._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: "Saved successfully!" });
      onSaved(res.data.media); // ← immediately update parent list

      // Auto-close after 1.2 s
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Save failed. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>Edit Photo</h3>
          <button onClick={onClose} style={styles.closeBtn} disabled={saving}>
            ✕
          </button>
        </div>

        {/* Message */}
        {message && (
          <div style={{ ...styles.message, ...styles[`msg_${message.type}`] }}>
            {message.text}
          </div>
        )}

        {/* Current image + replace */}
        <div style={styles.imageSection}>
          <img
            src={preview || media.url}
            alt="Media"
            style={styles.currentImg}
          />
          <div style={styles.replaceCol}>
            <p style={styles.label}>Replace image (optional)</p>
            <button
              onClick={() => fileInputRef.current.click()}
              style={styles.btnOutline}
              disabled={saving}>
              Choose New Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            {newFile && (
              <p style={styles.fileHint}>
                ✅ {newFile.name}
                <button
                  onClick={() => {
                    setNewFile(null);
                    setPreview(null);
                  }}
                  style={styles.removeFile}>
                  ✕
                </button>
              </p>
            )}
            {newFile && (
              <p style={{ color: "#f59e0b", fontSize: 12, marginTop: 4 }}>
                ⚠️ Face index will be re-processed after save.
              </p>
            )}
          </div>
        </div>

        {/* Caption */}
        <div style={styles.field}>
          <label style={styles.label}>Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            style={styles.textarea}
            placeholder="Add a caption..."
            disabled={saving}
          />
        </div>

        {/* Tags */}
        <div style={styles.field}>
          <label style={styles.label}>Tags (comma or space separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={styles.input}
            placeholder="e.g. sports, annual-day, 2024"
            disabled={saving}
          />
          {tags && (
            <div style={styles.tagPreview}>
              {tags
                .split(/[,\s]+/)
                .filter(Boolean)
                .map((t) => (
                  <span key={t} style={styles.tag}>
                    #{t}
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={onClose} style={styles.btnCancel} disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSave} style={styles.btnSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 16,
    width: "100%",
    maxWidth: 560,
    padding: 24,
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: "#f1f5f9" },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: 20,
    cursor: "pointer",
    padding: 4,
  },
  message: {
    padding: "10px 14px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  msg_success: { background: "#14532d", color: "#bbf7d0" },
  msg_error: { background: "#450a0a", color: "#fca5a5" },
  imageSection: {
    display: "flex",
    gap: 16,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  currentImg: {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: 10,
    border: "1px solid #1e293b",
    flexShrink: 0,
  },
  replaceCol: { flex: 1 },
  field: { marginBottom: 16 },
  label: { display: "block", color: "#94a3b8", fontSize: 13, marginBottom: 6 },
  textarea: {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#f1f5f9",
    fontSize: 14,
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
  },
  input: {
    width: "100%",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#f1f5f9",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  },
  tagPreview: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: {
    background: "#1e3a5f",
    color: "#93c5fd",
    padding: "3px 10px",
    borderRadius: 99,
    fontSize: 12,
  },
  btnOutline: {
    background: "transparent",
    border: "1px solid #475569",
    color: "#cbd5e1",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
  },
  fileHint: {
    color: "#4ade80",
    fontSize: 12,
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  removeFile: {
    background: "none",
    border: "none",
    color: "#f87171",
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  btnCancel: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: 14,
  },
  btnSave: {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
};
