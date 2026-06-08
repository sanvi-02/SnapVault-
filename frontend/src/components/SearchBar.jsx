import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import API from "../api/axios";

const RECENT_SEARCHES_KEY = "snapvault_recent_searches";
const MAX_RECENT = 5;

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      setRecentSearches(stored);
    } catch {
      setRecentSearches([]);
    }
  }, []);

  // Fetch suggestions on debounced query change
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions(null);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
        setSuggestions(res.data);
      } catch {
        setSuggestions(null);
      }
      setLoading(false);
    };
    fetchSuggestions();
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (term) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSearch = (searchTerm) => {
    const term = (searchTerm || query).trim();
    if (!term) return;
    saveRecentSearch(term);
    setIsOpen(false);
    setQuery("");
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setIsOpen(false);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const hasResults =
    suggestions &&
    (suggestions.events?.length > 0 ||
      suggestions.media?.length > 0 ||
      suggestions.tags?.length > 0 ||
      suggestions.photographers?.length > 0);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Search Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#f8f7ff",
          border: isOpen ? "1.5px solid #a78bfa" : "1.5px solid rgba(167,139,250,0.2)",
          borderRadius: "10px",
          padding: "6px 12px",
          transition: "all 0.2s",
          width: isOpen ? "320px" : "220px",
          boxShadow: isOpen ? "0 0 0 3px rgba(167,139,250,0.1)" : "none",
        }}
      >
        <span style={{ fontSize: "16px", marginRight: "8px", color: "#a78bfa" }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search events, photos, tags..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: "13px",
            color: "#1e1b4b",
            fontFamily: "Georgia, serif",
            width: "100%",
          }}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSuggestions(null);
              inputRef.current?.focus();
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "#9ca3af",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            minWidth: "340px",
            background: "#fff",
            borderRadius: "14px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(167,139,250,0.1)",
            zIndex: 200,
            maxHeight: "440px",
            overflowY: "auto",
            animation: "fadeIn 0.15s ease",
          }}
        >
          {/* Loading */}
          {loading && (
            <div style={{ padding: "16px", textAlign: "center", color: "#a78bfa", fontSize: "13px" }}>
              Searching...
            </div>
          )}

          {/* Suggestions */}
          {!loading && hasResults && (
            <div style={{ padding: "8px 0" }}>
              {/* Events */}
              {suggestions.events?.length > 0 && (
                <SuggestionGroup title="Events" icon="🎉">
                  {suggestions.events.map((e) => (
                    <SuggestionItem
                      key={e._id}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery("");
                        navigate(`/events/${e._id}`);
                      }}
                    >
                      <span style={{ fontWeight: "600", color: "#1e1b4b" }}>{e.name}</span>
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                        {e.category} · {new Date(e.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </span>
                    </SuggestionItem>
                  ))}
                </SuggestionGroup>
              )}

              {/* Tags */}
              {suggestions.tags?.length > 0 && (
                <SuggestionGroup title="Tags" icon="🏷️">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "4px 16px 8px" }}>
                    {suggestions.tags.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => {
                          setIsOpen(false);
                          setQuery("");
                          navigate(`/tags/${t.slug}`);
                        }}
                        style={{
                          background: "linear-gradient(135deg, #f0f4ff, #faf5ff)",
                          color: "#7c3aed",
                          border: "1px solid #e9d5ff",
                          borderRadius: "20px",
                          padding: "4px 12px",
                          fontSize: "12px",
                          fontWeight: "500",
                          cursor: "pointer",
                          fontFamily: "Georgia, serif",
                        }}
                      >
                        #{t.name}
                        {t.mediaCount > 0 && (
                          <span style={{ marginLeft: "4px", fontSize: "10px", color: "#a78bfa" }}>
                            ({t.mediaCount})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </SuggestionGroup>
              )}

              {/* Media */}
              {suggestions.media?.length > 0 && (
                <SuggestionGroup title="Photos" icon="📷">
                  {suggestions.media.map((m) => (
                    <SuggestionItem
                      key={m._id}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery("");
                        navigate(`/events/${m.eventId?._id || ""}`);
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <img
                          src={m.url}
                          alt=""
                          style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover" }}
                        />
                        <div>
                          <span style={{ fontWeight: "500", color: "#1e1b4b", fontSize: "13px" }}>
                            {m.caption || m.eventId?.name || "Photo"}
                          </span>
                          {m.tags?.length > 0 && (
                            <span style={{ fontSize: "11px", color: "#a78bfa", marginLeft: "6px" }}>
                              #{m.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </SuggestionItem>
                  ))}
                </SuggestionGroup>
              )}

              {/* Photographers */}
              {suggestions.photographers?.length > 0 && (
                <SuggestionGroup title="Photographers" icon="👤">
                  {suggestions.photographers.map((p) => (
                    <SuggestionItem
                      key={p._id}
                      onClick={() => handleSearch(p.name)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #a78bfa, #f9a8d4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            color: "#fff",
                            fontWeight: "600",
                          }}
                        >
                          {p.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: "600", color: "#1e1b4b", fontSize: "13px" }}>
                            {p.name}
                          </span>
                          <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "6px" }}>
                            {p.role}
                          </span>
                        </div>
                      </div>
                    </SuggestionItem>
                  ))}
                </SuggestionGroup>
              )}

              {/* View All */}
              <div style={{ padding: "8px 16px", borderTop: "1px solid #f3f4f6" }}>
                <button
                  onClick={() => handleSearch()}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #a78bfa, #f9a8d4)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  View all results for "{query}" →
                </button>
              </div>
            </div>
          )}

          {/* No results */}
          {!loading && query.length >= 2 && !hasResults && suggestions && (
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
              <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                No results for "{query}"
              </p>
            </div>
          )}

          {/* Recent searches (when empty) */}
          {!loading && query.length < 2 && recentSearches.length > 0 && (
            <div style={{ padding: "8px 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 16px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Recent Searches
                </span>
                <button
                  onClick={clearRecent}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#a78bfa",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((term, i) => (
                <SuggestionItem key={i} onClick={() => handleSearch(term)}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#d1d5db", fontSize: "14px" }}>🕐</span>
                    <span style={{ color: "#6b7280", fontSize: "13px" }}>{term}</span>
                  </div>
                </SuggestionItem>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ── Helper Components ─────────────────────────────────────────────────────────

const SuggestionGroup = ({ title, icon, children }) => (
  <div style={{ borderBottom: "1px solid #f3f4f6" }}>
    <div style={{ padding: "8px 16px 4px", display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{ fontSize: "13px" }}>{icon}</span>
      <span style={{ fontSize: "11px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </span>
    </div>
    {children}
  </div>
);

const SuggestionItem = ({ children, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "block",
      width: "100%",
      padding: "8px 16px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      textAlign: "left",
      transition: "background 0.1s",
      fontFamily: "Georgia, serif",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f7ff")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    {children}
  </button>
);

export default SearchBar;
