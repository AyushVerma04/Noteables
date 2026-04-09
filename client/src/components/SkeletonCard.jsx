export default function SkeletonCard() {
  return (
    <div className="note-card" style={{ pointerEvents: 'none' }}>
      <div className="note-card-header">
        <div className="skeleton" style={{ width: '70%', height: 20 }}></div>
        <div className="skeleton" style={{ width: 50, height: 20 }}></div>
      </div>
      <div className="note-card-meta">
        <div className="skeleton" style={{ width: 60, height: 14 }}></div>
        <div className="skeleton" style={{ width: 80, height: 14 }}></div>
        <div className="skeleton" style={{ width: 50, height: 14 }}></div>
      </div>
      <div className="note-card-footer">
        <div className="skeleton" style={{ width: 100, height: 16 }}></div>
        <div className="skeleton" style={{ width: 40, height: 16 }}></div>
      </div>
    </div>
  );
}
