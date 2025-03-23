import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LearningChat.css';
import { ChatInterface } from './ChatInterface';
import { FlashCard } from './FlashCard';

export const LearningChat = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<1 | 2>(1);
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      console.log('[AUTH] No user email found, redirecting...');
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    console.log('[LOGOUT] Logging out...');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const handleOptionClick = (option: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (getOptionDetails(option).disabled) return;
    setSelectedOption(option as 1 | 2);
    setMenuOpen(false);
  };

  const getOptionDetails = (option: number) => {
    switch (option) {
      case 1:
        return {
          title: 'Learning',
          subtitle: 'Learn by transitioning from English to German with chat',
          disabled: false
        };
      case 2:
        return {
          title: 'Practice v1',
          subtitle: 'Practice what you have learned with flashcard',
          disabled: false
        };
      case 3:
        return {
          title: 'Practice v2',
          subtitle: 'Practice what you have learned with chat',
          disabled: true
        };
      default:
        return {
          title: 'Learning',
          subtitle: 'Learn by transitioning from English to German with chat',
          disabled: false
        };
    }
  };

  // Outside click detection using a single ref for the dropdown area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setTimeout(() => {
        if (dropdownWrapperRef.current) {
          const clickedInside = dropdownWrapperRef.current.contains(event.target as Node);
          if (!clickedInside) {
            setMenuOpen(false);
          }
        }
      }, 0);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  return (
    <div className="learning-chat-container">
      <div className="learning-chat-header">
        <div className="dropdown-wrapper" ref={dropdownWrapperRef}>
          <div className={`logo-container ${menuOpen ? 'active' : ''}`}>
            <div className="logo-wrapper" onClick={toggleMenu}>
              <div className="text-logo">
                <span className="logo-part-1">Lang</span>
                <span className="logo-part-2">auge</span>
              </div>
              <span className="dropdown-arrow">
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M5 6L0 0H10L5 6Z" fill="currentColor" />
                </svg>
              </span>
            </div>
            {menuOpen && (
              <div
                className="dropdown-menu"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('[DEBUG] Dropdown menu clicked');
                }}
              >
                {[1, 2, 3].map((option) => (
                  <div
                    key={option}
                    className={`menu-option ${selectedOption === option ? 'selected' : ''} ${
                      getOptionDetails(option).disabled ? 'disabled' : ''
                    }`}
                    onClick={(e) => handleOptionClick(option, e)}
                  >
                    <div className="option-title">{getOptionDetails(option).title}</div>
                    <div className="option-subtitle">{getOptionDetails(option).subtitle}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="learning-chat-content">
        {selectedOption === 1 ? <ChatInterface /> : <FlashCard />}
      </div>
    </div>
  );
};
