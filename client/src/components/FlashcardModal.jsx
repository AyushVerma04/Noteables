import { useState } from 'react';

export default function FlashcardModal({ isOpen, onClose, flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!isOpen) return null;

  const nextCard = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150); // wait for flip back before changing content
  };

  const prevCard = () => {
    setFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content flashcard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span className="material-symbols-outlined" style={{ color: 'var(--secondary-container)', marginRight: 8, verticalAlign: 'middle' }}>psychology</span>
            AI Flashcards
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flashcard-progress">
          Card {currentIndex + 1} of {flashcards.length}
        </div>

        <div className="flashcard-container" onClick={() => setFlipped(!flipped)}>
          <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
            {/* Front of card (Question) */}
            <div className="flashcard-front">
              <span className="card-label badge badge-primary">Q</span>
              <p className="card-text">{currentCard?.question}</p>
              <div className="card-hint">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>touch_app</span>
                Tap to flip
              </div>
            </div>

            {/* Back of card (Answer) */}
            <div className="flashcard-back">
              <span className="card-label badge badge-secondary">A</span>
              <p className="card-text">{currentCard?.answer}</p>
              <div className="card-hint">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>touch_app</span>
                Tap to flip
              </div>
            </div>
          </div>
        </div>

        <div className="flashcard-controls">
          <button className="btn btn-secondary" onClick={prevCard}>
            <span className="material-symbols-outlined">arrow_back</span>
            Prev
          </button>
          <button className="btn btn-primary" onClick={nextCard}>
            Next
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
