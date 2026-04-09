import { useNavigate } from 'react-router-dom';

export default function NoteCard({ note }) {
  const navigate = useNavigate();
  const { title, metadata, fileType, upvoteCount, downvoteCount, commentCount, slugId } = note;

  return (
    <div className="note-card" onClick={() => navigate(`/view/${slugId}`)} id={`note-${slugId}`}>
      <div className="note-card-header">
        <h3>{title}</h3>
        <span className={`badge badge-${fileType}`}>
          {fileType.toUpperCase()}
        </span>
      </div>
      <div className="note-card-meta">
        <span>Year {metadata.year}</span>
        <span>•</span>
        <span>Sem {metadata.semester}</span>
        <span>•</span>
        <span>{metadata.subject}</span>
        <span>•</span>
        <span>{metadata.teacher}</span>
      </div>
      <div className="note-card-footer">
        <div className="note-card-votes">
          <span className="material-symbols-outlined vote-up">thumb_up</span>
          <span>{upvoteCount || 0}</span>
          <span className="material-symbols-outlined">thumb_down</span>
          <span>{downvoteCount || 0}</span>
          <span className="material-symbols-outlined">chat_bubble</span>
          <span>{commentCount || 0}</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>
          Unit {metadata.unit}
        </span>
      </div>
    </div>
  );
}
