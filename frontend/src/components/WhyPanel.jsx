import { useState } from "react";
import { explain } from "../api.js";

export default function WhyPanel({ kind, itemKey }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (text || error || loading) return;
    setLoading(true);
    try {
      const result = await explain(kind, itemKey);
      setText(result.explanation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="btn ghost" onClick={toggle}>
        {open ? "Hide why" : "Why?"}
      </button>
      {open && (
        <div className={`why-panel ${!text ? "muted" : ""}`} style={{ flexBasis: "100%" }}>
          {loading && "Loading…"}
          {error && `Не удалось получить разбор: ${error}`}
          {text}
        </div>
      )}
    </>
  );
}
