import { useState, useEffect, useRef } from "react";
import { submitAnswer } from "../api.js";
import WhyPanel from "./WhyPanel.jsx";

export default function VerbCard({ item, onAnswered, onNext }) {
  const [past, setPast] = useState("");
  const [participle, setParticiple] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const pastRef = useRef(null);

  useEffect(() => {
    setPast("");
    setParticiple("");
    setFeedback(null);
    pastRef.current?.focus();
  }, [item.key]);

  async function submit() {
    if (submitting || feedback) return;
    if (!past.trim() || !participle.trim()) return;
    setSubmitting(true);
    try {
      const result = await submitAnswer({
        kind: "verb",
        key: item.key,
        userPast: past,
        userParticiple: participle,
      });
      setFeedback(result);
      onAnswered?.(result);
    } catch (err) {
      setFeedback({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") submit();
  }

  return (
    <section className="card">
      <h2 className="word">{item.infinitive}</h2>
      <div className="inputs">
        <label>
          past
          <input
            ref={pastRef}
            value={past}
            onChange={(e) => setPast(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!!feedback || submitting}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <label>
          participle
          <input
            value={participle}
            onChange={(e) => setParticiple(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!!feedback || submitting}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>

      {!feedback && (
        <div className="actions">
          <button className="btn" onClick={submit} disabled={submitting || !past.trim() || !participle.trim()}>
            {submitting ? "..." : "Check"}
          </button>
        </div>
      )}

      {feedback && !feedback.error && (
        <div className={`feedback ${feedback.correct ? "correct" : "wrong"}`}>
          <p className="verdict">{feedback.correct ? "Klopt!" : "Niet helemaal"}</p>
          <p className="answer">
            {feedback.correctAnswer.past} · {feedback.correctAnswer.participle}
          </p>
          <p className="meaning">{feedback.meaning_ru}</p>
          <div className="actions">
            <button className="btn" onClick={onNext}>Next</button>
            <WhyPanel kind="verb" itemKey={item.key} />
          </div>
        </div>
      )}

      {feedback?.error && <p className="why-panel muted">Ошибка: {feedback.error}</p>}
    </section>
  );
}
