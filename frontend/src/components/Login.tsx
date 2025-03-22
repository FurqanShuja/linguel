import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/images/background_image.jpg';
import './Login.css';

interface LoginResponse {
  email: string;
  password: string;
  error?: string;
}

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showNotification, setShowNotification] = useState(false);
  
  const navigate = useNavigate();
  
  // Define the API URL directly if environment variable isn't working
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  // Handle notification display
  useEffect(() => {
    if (notification.message) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Handle successful login redirect
  useEffect(() => {
    if (notification.type === 'success') {
      // Wait for the notification to display before transitioning
      const timer = setTimeout(() => {
        // Store the user email in localStorage or context if needed
        localStorage.setItem('userEmail', email);
        // Navigate to the learning chat page
        navigate('/learning-chat');
      }, 1500); // Wait 1.5 seconds before transitioning
      return () => clearTimeout(timer);
    }
  }, [notification, navigate, email]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.get<LoginResponse>(`${API_URL}/authenticate?email=${email}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data.error) {
        setNotification({ message: 'Invalid details', type: 'error' });
        return;
      }

      if (response.data.password === password) {
        setNotification({ message: 'Successful', type: 'success' });
        // Navigation is handled in the useEffect above
      } else {
        setNotification({ message: 'Invalid details', type: 'error' });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setNotification({ message: 'Connection error', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <form onSubmit={handleLogin} className="login-form">
        <div className="input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            required
            autoFocus
          />
        </div>
        
        <div className="input-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      
      {/* Custom notification at bottom of screen */}
      <div className={`notification ${notification.type} ${showNotification ? 'show' : ''}`}>
        {notification.message}
      </div>
    </div>
  );
}; 