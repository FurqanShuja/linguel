import { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  grammar?: { [key: string]: string };
  vocabulary?: { [key: string]: string };
}

interface ChatInterfaceProps {
  scenarioContext?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ scenarioContext }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]); // Changed to array
  const [isExiting, setIsExiting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(14); // Default font size
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [closingMessages, setClosingMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
            const loadedMessages = data.history.map((msg: any, index: number) => ({
              id: msg.id || `loaded-${index}-${Date.now()}`,
              content: msg.message,
              sender: msg.source === 'ai' ? 'ai' : 'user',
              timestamp: new Date(msg.timestamp || Date.now()),
              grammar: (msg.grammar && typeof msg.grammar === 'object') ? msg.grammar : {},
              vocabulary: (msg.vocabulary && typeof msg.vocabulary === 'object') ? msg.vocabulary : {}
            }));
            setMessages(loadedMessages);
          }
        })
        .catch((err) => console.error('Error fetching chat history:', err));
    }
  }, [BASE_URL]);

  const scrollToBottom = () => {
    setTimeout(() => {
      const messages = document.querySelector('.chat-messages');
      if (!messages) return;
      
      const targetScroll = messages.scrollHeight;
      const startScroll = messages.scrollTop;
      const distance = targetScroll - startScroll;
      const duration = 500; // 5 seconds
      let start: number;

      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smoother animation
        const easing = (t: number) => t * (2 - t);
        
        messages.scrollTop = startScroll + (distance * easing(progress));

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    },200); // 1 second initial delay
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll when messages update

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

  const applySuggestion = async (suggestion: string) => {
    if (!suggestion.includes('->')) return;
    
    // Parse the suggestion
    const parts = suggestion.split('->');
    const originalPart = parts[0].trim();
    const replacementText = parts[1].trim();
    
    // Extract the original text without the type prefix
    let originalText = originalPart;
    if (originalPart.includes(':')) {
      originalText = originalPart.split(':')[1].trim();
    }
    
    // Create a regex that matches the word with space, question mark, exclamation mark or period boundaries
    const regex = new RegExp(`(\\s|\\.|\\?|\\!|^)${originalText}(\\s|\\.|\\?|\\!|$)`, 'g');
    
    // Replace in the input message, preserving the boundary characters
    const newInputMessage = inputMessage.replace(regex, (match, p1, p2) => {
      return `${p1}${replacementText}${p2}`;
    });
    
    // First set the exiting state for smooth animation
    setIsExiting(true);
    
    // Wait for the exit animation to complete before updating the input
    setTimeout(() => {
      setInputMessage(newInputMessage);
      
      // Save the replacement card
      saveReplacement(suggestion);
      
      // Clear suggestions after the animation completes
      setTimeout(() => {
        setSuggestions([]);
        setIsExiting(false);
      }, 100); // Short delay to ensure state is updated properly
    }, 300); // Match the animation duration
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Immediately show user message and start loading
    setMessages([...messages, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Use the new endpoint that returns analysis data
      const resp = await fetch(`${BASE_URL}/learning_chat_with_analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: newMessage.content,
          email: userEmail,
          situation: scenarioContext || 'You are in a waiter in a cafe and conversing with the user to take his order'
        })
      });
      
      const data = await resp.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const aiResponse = data.response || 'No response received';
      const userAnalysis = data.user_analysis || { grammar: {}, vocabulary: {} };
      const aiAnalysis = data.ai_analysis || { grammar: {}, vocabulary: {} };
      
      // Validate and sanitize analysis data
      const sanitizeAnalysis = (analysis: any) => ({
        grammar: (analysis.grammar && typeof analysis.grammar === 'object') ? analysis.grammar : {},
        vocabulary: (analysis.vocabulary && typeof analysis.vocabulary === 'object') ? analysis.vocabulary : {}
      });
      
      const sanitizedUserAnalysis = sanitizeAnalysis(userAnalysis);
      const sanitizedAiAnalysis = sanitizeAnalysis(aiAnalysis);
      
      // Update the user message with analysis
      const updatedUserMessage: Message = {
        ...newMessage,
        grammar: sanitizedUserAnalysis.grammar,
        vocabulary: sanitizedUserAnalysis.vocabulary
      };
      
      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        grammar: sanitizedAiAnalysis.grammar,
        vocabulary: sanitizedAiAnalysis.vocabulary
      };
      
      // Update messages with both user and AI messages including analysis
      setMessages(prev => {
        const updatedMessages = [...prev];
        // Replace the last message (user message) with the analyzed version
        updatedMessages[updatedMessages.length - 1] = updatedUserMessage;
        // Add the AI message
        updatedMessages.push(newAiMessage);
        return updatedMessages;
      });
    } catch (error) {
      console.error('Error in chat sequence:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Error processing your request. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // "Trigger flashcard" – calls /trigger_replacement with the current user input
  // and places the returned text in `suggestion` (shown above the input)
  const handleIconClick = async () => {
    if (!inputMessage.trim()) return;

    try {
      // First, hide any existing suggestions with the exit animation
      if (suggestions.length > 0) {
        setIsExiting(true);
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for exit animation
      }
      
      // Clear existing suggestions
      setSuggestions([]);
      setIsExiting(false);
      
      const resp = await fetch(`${BASE_URL}/trigger_replacement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: inputMessage,
          email: userEmail
        })
      });
      
      const data = await resp.json();
      const result = data.result || '';
      
      // Process all suggestions at once
      let suggestionList = [];
      
      if (result === 'None') {
        // If no suggestions, show a single 'None' suggestion
        suggestionList = ['None'];
      } else {
        // Split by line breaks to get multiple suggestions
        suggestionList = result.split('\n').filter((s: string) => s.trim() !== '');
        suggestionList = suggestionList.slice(0, 3); // Limit to max 3 suggestions
      }
      
      // Use a small delay to ensure DOM updates are batched
      setTimeout(() => {
        // Set all suggestions at once
        setSuggestions(suggestionList);
      }, 50);
    } catch (error) {
      console.error('Error calling /trigger_replacement:', error);
    }
  };

  const adjustFontSize = (increment: boolean) => {
    setFontSize(prev => {
      const newSize = increment ? prev + 1 : prev - 1;
      return Math.min(Math.max(newSize, 12), 20); // Limit between 12px and 20px
    });
  };

  const toggleMessageExpansion = (messageId: string) => {
    const isLastMessage = messages.length > 0 && messages[messages.length - 1].id === messageId;
    
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        // Start closing animation
        setClosingMessages(prevClosing => new Set(prevClosing).add(messageId));
        
        // Remove from expanded after animation completes
        setTimeout(() => {
          setExpandedMessages(prevExpanded => {
            const updatedSet = new Set(prevExpanded);
            updatedSet.delete(messageId);
            return updatedSet;
          });
          setClosingMessages(prevClosing => {
            const updatedSet = new Set(prevClosing);
            updatedSet.delete(messageId);
            return updatedSet;
          });
        }, 300); // Match animation duration
        
        return newSet; // Don't remove immediately
      } else {
        newSet.add(messageId);
        
        // If this is the last message being expanded, scroll to bottom after expansion
        if (isLastMessage) {
          setTimeout(() => {
            scrollToBottom();
          }, 350); // Wait for expansion animation to complete
        }
        
        return newSet;
      }
    });
  };

  return (
    <div className="chat-interface">
      <div className="font-size-controls">
        <button onClick={() => adjustFontSize(false)} className="font-size-btn">
          <span>−</span>
        </button>
        <button onClick={() => adjustFontSize(true)} className="font-size-btn">
          <span>+</span>
        </button>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            style={{ fontSize: `${fontSize}px` }}
          >
            <div className="message-content">
              {message.sender === 'user' && (
                <div 
                  className={`expand-icon left ${expandedMessages.has(message.id) ? 'expanded' : ''}`}
                  onClick={() => toggleMessageExpansion(message.id)}
                >
                  ❯
                </div>
              )}
              <div className="message-text">
                {message.content}
              </div>
              {message.sender === 'ai' && (
                <div 
                  className={`expand-icon right ${expandedMessages.has(message.id) ? 'expanded' : ''}`}
                  onClick={() => toggleMessageExpansion(message.id)}
                >
                  ❯
                </div>
              )}
            </div>
            {(expandedMessages.has(message.id) || closingMessages.has(message.id)) && (
              <div className={`expanded-content ${closingMessages.has(message.id) ? 'closing' : ''}`}>
                {/* Display Vocabulary section */}
                {message.vocabulary && Object.keys(message.vocabulary).length > 0 && (
                  <div className="vocabulary-section">
                    <strong>Vocabulary:</strong>
                    <div className="vocabulary-items">
                      {Object.entries(message.vocabulary).map(([german, english], index) => (
                        <div key={index} className="vocabulary-item">
                          {german} → {english}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Display Grammar section */}
                {message.grammar && Object.keys(message.grammar).length > 0 && (
                  <div className="grammar-section">
                    <strong>Grammar:</strong>
                    <div className="grammar-items">
                      {Object.entries(message.grammar).map(([german, english], index) => (
                        <div key={index} className="grammar-item">
                          {german} → {english}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show message if no German content found */}
                {(!message.vocabulary || Object.keys(message.vocabulary).length === 0) && 
                 (!message.grammar || Object.keys(message.grammar).length === 0) && (
                  <div className="no-content">
                    No German vocabulary or grammar detected in this message.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message ai-message loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Scroll anchor */}
      </div>

      <div className="chat-input">
        {suggestions.length > 0 && (
          <div className={`suggestions-container ${isExiting ? 'exiting' : ''}`}>
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="suggestion-item"
                onClick={() => suggestion !== 'None' ? applySuggestion(suggestion) : null}
              >
                {suggestion}
              </div>
            ))}
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
