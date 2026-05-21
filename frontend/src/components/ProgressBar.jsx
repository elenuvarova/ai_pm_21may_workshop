export default function ProgressBar({ counts }) {
  if (!counts) return <div className="progress">&nbsp;</div>;
  return (
    <div className="progress">
      <span><b>{counts.new}</b>new</span>
      <span><b>{counts.learning}</b>learning</span>
      <span><b>{counts.review}</b>review</span>
      <span><b>{counts.mastered}</b>mastered</span>
    </div>
  );
}
