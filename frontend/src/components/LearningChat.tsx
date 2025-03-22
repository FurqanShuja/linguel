import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LearningChat.css';

export const LearningChat = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    // Get user email from localStorage or redirect if not logged in
    const email = localStorage.getItem('userEmail');
    if (!email) {
      navigate('/');
      return;
    }
    setUserEmail(email);
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    navigate('/');
  };
  
  const handleOptionClick = (option: number) => {
    console.log(`Option ${option} clicked`);
    // Add functionality for each option here
    setMenuOpen(false);
  };
  
  return (
    <div className="learning-chat-container">
      <div className="learning-chat-header">
        <div className={`logo-container ${menuOpen ? 'active' : ''}`}>
          <div className="logo-wrapper" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="text-logo">
              <span className="logo-part-1">Lang</span>
              <span className="logo-part-2">auge</span>
            </div>
            <span className="dropdown-arrow">
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 6L0 0H10L5 6Z" fill="currentColor"/>
              </svg>
            </span>
          </div>
          
          {menuOpen && (
            <div className="dropdown-menu">
              <div className="menu-option" onClick={() => handleOptionClick(1)}>
                <div className="option-title">Learning</div>
                <div className="option-subtitle">Learn by transitioning from English to German with chat</div>
              </div>
              <div className="menu-option" onClick={() => handleOptionClick(2)}>
                <div className="option-title">Practice v1</div>
                <div className="option-subtitle">Practice what you have learned with chat</div>
              </div>
              <div className="menu-option disabled">
                <div className="option-title">Practice v2</div>
                <div className="option-subtitle">Practice what you have learned with flashcard</div>
              </div>
            </div>
          )}
        </div>
        
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="learning-chat-content">
        <p>Start your learning conversation here</p>
        {/* Add your chat interface components here */}
      </div>
    </div>
  );
}; 