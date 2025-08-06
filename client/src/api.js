const BASE = import.meta.env.VITE_API || "http://localhost:4000";

export async function createShort(longUrl, code) {
  const res = await fetch(`${BASE}/shorten`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ longUrl, code: code || undefined })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to shorten");
  return data;
}

export async function getStats(code) {
  const res = await fetch(`${BASE}/stats/${code}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch stats");
  return data;
}
