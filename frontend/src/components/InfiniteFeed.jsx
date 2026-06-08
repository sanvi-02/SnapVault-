import { useState, useEffect, useRef, useCallback } from "react";
import API from "../api/axios";
import MediaFeedCard from "./MediaFeedCard";

const LIMIT = 10;

const SkeletonCard = () => (
  <div style={{
    background: "var(--bg-2)", borderRadius: "20px",
    border: "1px solid var(--border-subtle)", overflow: "hidden",
  }}>
    <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "10px" }}>
      <div className="skeleton" style={{ width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div className="skeleton" style={{ height: "12px", width: "40%" }} />
        <div className="skeleton" style={{ height: "10px", width: "25%" }} />
      </div>
    </div>
    <div className="skeleton" style={{ height: "260px", borderRadius: 0 }} />
    <div style={{ padding: "12px 18px", display: "flex", gap: "8px" }}>
      <div className="skeleton" style={{ height: "32px", width: "80px", borderRadius: "99px" }} />
      <div className="skeleton" style={{ height: "32px", width: "100px", borderRadius: "99px" }} />
    </div>
  </div>
);

const InfiniteFeed = ({ endpoint = "/media/all" }) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const loaderRef = useRef(null);
  const loadedPages = useRef(new Set());

  const fetchPage = useCallback(async (pageNum) => {
    if (loadedPages.current.has(pageNum) || loading) return;
    loadedPages.current.add(pageNum);
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(endpoint, { params: { page: pageNum, limit: LIMIT } });
      const data = res.data?.items || res.data || [];
      const hasNextPage = res.data?.hasMore ?? (data.length === LIMIT);
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => i._id));
        const newItems = data.filter((i) => !existingIds.has(i._id));
        return [...prev, ...newItems];
      });
      setHasMore(hasNextPage);
    } catch (err) {
      console.error("Feed fetch error:", err);
      setError("Failed to load posts. Please try again.");
      loadedPages.current.delete(pageNum); // allow retry
    }
    setLoading(false);
    setInitialLoad(false);
  }, [endpoint, loading]);

  // Initial load
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setInitialLoad(true);
    loadedPages.current = new Set();
  }, [endpoint]);

  useEffect(() => {
    fetchPage(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  if (initialLoad) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!initialLoad && items.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "80px 40px",
        background: "var(--glass-bg)", borderRadius: "24px",
        border: "1px solid var(--border-subtle)",
      }}>
        <div style={{ fontSize: "52px", marginBottom: "16px", animation: "float 3s ease-in-out infinite" }}>📭</div>
        <p style={{ color: "var(--text-2)", fontSize: "17px", fontWeight: "600", marginBottom: "6px" }}>No posts yet</p>
        <p style={{ color: "var(--text-4)", fontSize: "14px" }}>Upload media to an event to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {items.map((item) => (
          <MediaFeedCard key={item._id} item={item} />
        ))}
      </div>

      {/* Loader sentinel */}
      <div ref={loaderRef} style={{ padding: "32px 0", display: "flex", justifyContent: "center" }}>
        {loading && !initialLoad && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-4)" }}>
            <div style={{
              width: "20px", height: "20px",
              border: "2px solid var(--border-medium)",
              borderTop: "2px solid var(--accent-1)",
              borderRadius: "50%", animation: "spin 0.8s linear infinite",
            }} />
            <span style={{ fontSize: "13px", fontWeight: "500" }}>Loading more…</span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            color: "var(--text-4)", fontSize: "13px", fontWeight: "500",
          }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)", maxWidth: "60px" }} />
            <span>You've seen everything </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border-subtle)", maxWidth: "60px" }} />
          </div>
        )}
        {error && (
          <div style={{ color: "#f87171", fontSize: "13px", textAlign: "center" }}>
            {error}
            <button
              onClick={() => { loadedPages.current.delete(page); fetchPage(page); }}
              style={{
                marginLeft: "12px", background: "none", border: "1px solid #f87171",
                borderRadius: "6px", padding: "3px 10px", color: "#f87171",
                cursor: "pointer", fontSize: "12px", fontFamily: "Inter,sans-serif",
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfiniteFeed;
