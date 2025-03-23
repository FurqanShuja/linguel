import { useState, useEffect } from 'react';
import './ChatInterface.css';

interface Message {
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [matchFound, setMatchFound] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Retrieve the backend base URL from your .env (e.g. VITE_API_URL=http://127.0.0.1:8000)
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  // On component mount, load the user's email and fetch existing chat history
  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);

    if (email) {
      fetch(`${BASE_URL}/chat_history?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          // Expecting data.history to be an array of messages
          // Adjust shape as needed if your API differs
          if (data.history && Array.isArray(data.history)) {
            const loadedMessages = data.history.map((msg: any) => ({
              content: msg.message,
              sender: msg.source === 'ai' ? 'ai' : 'user',
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(loadedMessages);
          }
        })
        .catch((err) => console.error('Error fetching chat history:', err));
    }
  }, [BASE_URL]);

  const saveReplacement = async (replacementText: string) => {
    try {
      await fetch(`${BASE_URL}/save_replacement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          replacement: replacementText
        })
      });
    } catch (error) {
      console.error('Error saving replacement:', error);
    }
  };

  const checkSuggestionMatch = (userText: string) => {
    if (suggestion && suggestion.includes('->')) {
      const rightSide = suggestion.split('->')[1]?.trim().toLowerCase() || '';
      if (rightSide && userText.toLowerCase().includes(rightSide)) {
        setMatchFound(true);
        // Save the replacement when match is found
        saveReplacement(suggestion);
        
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setSuggestion(null);
            setMatchFound(false);
            setIsExiting(false);
          }, 300);
        }, 2000);
      } else {
        setIsExiting(true);
        setTimeout(() => {
          setSuggestion(null);
          setIsExiting(false);
        }, 300);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    checkSuggestionMatch(inputMessage);
    
    const newMessage: Message = {
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Send message to backend
    try {
      const resp = await fetch(`${BASE_URL}/learning_chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: newMessage.content,
          email: userEmail,
          // Fixed scenario
          situation: 'You are in a waiter in a cafe and conversing with the user to take his order'
        })
      });
      const data = await resp.json();

      const aiResponse = data.result || 'No response received';
      const newAiMessage: Message = {
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, newAiMessage]);
    } catch (error) {
      console.error('Error calling /learning_chat:', error);
      const newAiMessage: Message = {
        content: 'Error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, newAiMessage]);
    }
  };

  // "Trigger flashcard" – calls /trigger_replacement with the current user input
  // and places the returned text in `suggestion` (shown above the input)
  const handleIconClick = async () => {
    if (!inputMessage.trim()) return;

    try {
      const resp = await fetch(`${BASE_URL}/trigger_replacement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: inputMessage,
          email: userEmail
        })
      });
      const data = await resp.json();
      setSuggestion(data.result || null);
    } catch (error) {
      console.error('Error calling /trigger_replacement:', error);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="chat-input">
        {suggestion && (
          <div className={`suggestion-popup ${matchFound ? 'match-found' : ''} ${isExiting ? 'exiting' : ''}`}>
            {suggestion}
          </div>
        )}

        <div className="chat-input-container">
          {/* Make the AI icon clickable for "trigger flashcard" */}
          <svg 
            className="ai-icon"
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            onClick={handleIconClick}  // <-- Trigger replacement logic
            style={{ cursor: 'pointer' }}
          >
            <path 
              fillRule="evenodd" 
              d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.9l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" 
              clipRule="evenodd" 
            />
          </svg>

          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />

          <button
            type="submit"
            className="send-button"
            onClick={handleSendMessage}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 2L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
