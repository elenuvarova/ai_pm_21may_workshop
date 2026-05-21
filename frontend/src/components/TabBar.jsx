export default function TabBar({ active, onChange }) {
  return (
    <div className="tabs">
      <button
        className={`tab ${active === "verb" ? "active" : ""}`}
        onClick={() => onChange("verb")}
      >
        Sterke werkwoorden
      </button>
      <button
        className={`tab ${active === "noun" ? "active" : ""}`}
        onClick={() => onChange("noun")}
      >
        Het of de
      </button>
    </div>
  );
}
