import { useEffect, useState } from "react";

function useJson(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, error, loading };
}

function Card({ title, state }) {
  const { data, error, loading } = state;
  return (
    <section className="card">
      <h2>{title}</h2>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">Error: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </section>
  );
}

export default function App() {
  const hello = useJson("/api/hello");
  const health = useJson("/api/health");

  return (
    <main className="app">
      <h1>AI PM Workshop</h1>
      <p className="muted">React + Vite frontend talking to an Express + Sequelize backend.</p>
      <Card title="/api/hello" state={hello} />
      <Card title="/api/health" state={health} />
    </main>
  );
}
