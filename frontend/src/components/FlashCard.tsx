import { useState, useEffect } from 'react';
import './FlashCard.css';

interface FlashCard {
  type: string;
  title: string;
  description: string;
  question: string;
  answer: string;
}

export const FlashCard = () => {
  const [card, setCard] = useState<FlashCard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const email = localStorage.getItem('userEmail');

  // Fetch the current flashcard from the API
  const fetchCard = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const resp = await fetch(`${BASE_URL}/show_card?email=${encodeURIComponent(email)}`);
      const data = await resp.json();
      // Expect the API to return { card: { type, title, description, question, answer } }
      if (typeof data.card === 'object') {
        setCard(data.card);
      } else {
        setCard(null);
        console.error('No card received', data.card);
      }
    } catch (error) {
      console.error('Error fetching card:', error);
    } finally {
      setLoading(false);
    }
  };

  // Call update_card endpoint with the selected option and then refresh the card
  const updateCard = async (option: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    if (!card || !email) return;
    try {
      const resp = await fetch(`${BASE_URL}/update_card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          title: card.title,
          option_selected: option
        })
      });
      const data = await resp.json();
      console.log('Update result:', data.result);
      // After updating, refresh the flashcard
      setIsFlipped(false);
      fetchCard();
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  useEffect(() => {
    fetchCard();
  }, []);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flashcard-wrapper">
      <div className="flashcard-container">
        {card ? (
          <>
            <div 
              className={`flashcard ${isFlipped ? 'flipped' : ''}`}
              onClick={handleFlip}
            >
              <div className="flashcard-front">
                <div className="card-content">
                  <h3>{card.type}</h3>
                  <p>{card.title}</p>
                </div>
              </div>
              <div className="flashcard-back">
              <div className="card-content">
                <p style={{ fontSize: '2em' }}>{card.description}</p>
                <p style={{ marginTop: '1em' }}><strong>Example</strong></p>
                <p style={{ marginTop: '1em', fontSize: '0.9em' }}>EN: {card.question}</p>
                <p style={{ marginTop: '1em', fontSize: '0.9em' }}>DE: {card.answer}</p>
                </div>
              </div>
            </div>
            
            <div className="button-container">
              <button 
                className="review-btn again" 
                onClick={() => updateCard("AGAIN")}
              >
                AGAIN
              </button>
              <button 
                className="review-btn hard" 
                onClick={() => updateCard("HARD")}
              >
                HARD
              </button>
              <button 
                className="review-btn good" 
                onClick={() => updateCard("GOOD")}
              >
                GOOD
              </button>
              <button 
                className="review-btn easy" 
                onClick={() => updateCard("EASY")}
              >
                EASY
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: 'white', textAlign: 'center' }}>
            {loading ? 'Loading flashcard...' : 'No available flashcard.'}
          </div>
        )}
      </div>
    </div>
  );
};
