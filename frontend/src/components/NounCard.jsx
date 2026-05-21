import { useState, useEffect } from "react";
import { submitAnswer } from "../api.js";

export default function NounCard({ item, onAnswered, onNext }) {
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFeedback(null);
  }, [item.key]);

  async function pick(article) {
    if (submitting || feedback) return;
    setSubmitting(true);
    try {
      const result = await submitAnswer({
        kind: "noun",
        key: item.key,
        userArticle: article,
      });
      setFeedback({ ...result, userArticle: article });
      onAnswered?.(result);
    } catch (err) {
      setFeedback({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h2 className="word">{item.word}</h2>

      <div className="article-buttons">
        <button onClick={() => pick("het")} disabled={!!feedback || submitting}>het</button>
        <button onClick={() => pick("de")} disabled={!!feedback || submitting}>de</button>
      </div>

      {feedback && !feedback.error && (
        <div className={`feedback ${feedback.correct ? "correct" : "wrong"}`}>
          <p className="verdict">
            {feedback.correct ? "Klopt!" : `Het is ${feedback.correctAnswer.article}`}
          </p>
          <p className="meaning">{feedback.meaning_ru}</p>
          <div className="actions">
            <button className="btn" onClick={onNext}>Next</button>
          </div>
        </div>
      )}

      {feedback?.error && <p className="error-box">Ошибка: {feedback.error}</p>}
    </section>
  );
}
