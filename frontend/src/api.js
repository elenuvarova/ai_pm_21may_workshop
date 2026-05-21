async function req(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) detail = body.error;
    } catch {}
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const getQueue = (kind, limit = 10) =>
  req(`/api/queue?kind=${kind}&limit=${limit}`);

export const submitAnswer = (payload) =>
  req("/api/answer", { method: "POST", body: JSON.stringify(payload) });

export const getStats = () => req("/api/stats");

export const explain = (kind, key) =>
  req("/api/explain", { method: "POST", body: JSON.stringify({ kind, key }) });
