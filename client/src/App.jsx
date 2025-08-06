import { useEffect, useState } from "react";

export default function App() {
  const [longUrl, setLongUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [links, setLinks] = useState([]);

  const [activeStats, setActiveStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsFor, setStatsFor] = useState(null);

  const loadLinks = async () => {
    try {
      const res = await fetch("/links");
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const payload = { user: { longUrl } };
      if (customCode.trim()) payload.user.code = customCode.trim();

      const res = await fetch("/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create");

      setLongUrl("");
      setCustomCode("");
      await loadLinks();
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const openStats = async (code) => {
    setLoadingStats(true);
    setActiveStats(null);
    setStatsFor(code);
    try {
      const res = await fetch(`/stats/${code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch stats");
      setActiveStats(data);
    } catch (e) {
      setActiveStats({ error: e.message });
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>URL Shortener</h1>

      <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Long URL</label>
          <input
            type="url"
            required
            placeholder="https://example.com/page"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            style={{ width: "100%", padding: 10, display: "block" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Shortcode (optional, 4–20 chars)</label>
          <input
            minLength={4}
            maxLength={20}
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            placeholder="(optional) my-alias"
            style={{ width: "100%", padding: 10, display: "block" }}
          />
        </div>
        <button disabled={creating} type="submit">
          {creating ? "Creating..." : "Shorten"}
        </button>
        {error && <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>}
      </form>

      <div style={{ marginTop: 28 }}>
        <h2>All links</h2>
        {!links.length && <p style={{ color: "#555" }}>No links yet.</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {links.map((l) => (
            <li key={l._id} style={{ borderBottom: "1px solid #eee", padding: "12px 0" }}>
              <div>
                <a href={l.shortUrl} target="_blank" rel="noreferrer">
                  {l.shortUrl}
                </a>
              </div>
              <div style={{ color: "#555", fontSize: 14, marginTop: 4 }}>{l.longUrl}</div>

              {/* Removed the inline Clicks/Created summary */}

              <div style={{ marginTop: 8 }}>
                <button onClick={() => openStats(l.code)} disabled={loadingStats && statsFor === l.code}>
                  {loadingStats && statsFor === l.code ? "Loading..." : "View Stats"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {activeStats && (
        <div style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
          <h3>Stats</h3>
          {"error" in activeStats ? (
            <p style={{ color: "crimson" }}>{activeStats.error}</p>
          ) : (
            <>
              <p><b>Short URL:</b> <a href={activeStats.shortUrl} target="_blank" rel="noreferrer">{activeStats.shortUrl}</a></p>
              <p><b>Long URL:</b> {activeStats.longUrl}</p>
              <p><b>Code:</b> {activeStats.code}</p>
              <p><b>Clicks:</b> {activeStats.clicks}</p>
              <p><b>Created:</b> {new Date(activeStats.createdAt).toLocaleString()}</p>
              <p><b>Updated:</b> {new Date(activeStats.updatedAt).toLocaleString()}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
