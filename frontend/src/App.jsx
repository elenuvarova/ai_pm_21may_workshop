import { useState, useEffect, useCallback } from "react";
import TabBar from "./components/TabBar.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import VerbCard from "./components/VerbCard.jsx";
import NounCard from "./components/NounCard.jsx";
import { getQueue, getStats } from "./api.js";

function TrainerTab({ kind }) {
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [nextDueAt, setNextDueAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsTick, setStatsTick] = useState(0);
  const [counts, setCounts] = useState(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQueue(kind, 10);
      setItems(data.items);
      setNextDueAt(data.nextDueAt);
      setIdx(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  useEffect(() => {
    getStats()
      .then((s) => setCounts(kind === "verb" ? s.verbs : s.nouns))
      .catch(() => {});
  }, [kind, statsTick]);

  function onAnswered() {
    setStatsTick((t) => t + 1);
  }

  function onNext() {
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
    } else {
      loadQueue();
    }
  }

  if (loading) {
    return (
      <>
        <ProgressBar counts={counts} />
        <div className="empty">Loading…</div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <ProgressBar counts={counts} />
        <div className="empty">Ошибка: {error}</div>
      </>
    );
  }
  if (items.length === 0) {
    return (
      <>
        <ProgressBar counts={counts} />
        <div className="empty">
          Готово на сегодня.
          {nextDueAt && (
            <div className="next-due">
              Следующее повторение: {new Date(nextDueAt).toLocaleString("ru-RU")}
            </div>
          )}
        </div>
      </>
    );
  }

  const item = items[idx];
  const cardProps = { item, onAnswered, onNext };

  return (
    <>
      <ProgressBar counts={counts} />
      {kind === "verb" ? <VerbCard {...cardProps} /> : <NounCard {...cardProps} />}
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState("verb");
  const [globalStats, setGlobalStats] = useState(null);

  useEffect(() => {
    let mounted = true;
    function refresh() {
      getStats().then((s) => mounted && setGlobalStats(s)).catch(() => {});
    }
    refresh();
    const id = setInterval(refresh, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <main className="app">
      <header className="header">
        <h1>Dutch Trainer</h1>
        <span className="streak">
          {globalStats ? `streak ${globalStats.streak} · ${globalStats.done_today} сегодня` : "—"}
        </span>
      </header>
      <TabBar active={tab} onChange={setTab} />
      <TrainerTab key={tab} kind={tab} />
    </main>
  );
}
