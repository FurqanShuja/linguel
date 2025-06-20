import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from "framer-motion"
import backgroundImage from '../assets/images/background_image.jpg';
import './Login.css';

// Define the expected response type for Google auth
interface GoogleAuthResponse {
  auth_url: string;
}

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Define the API URL directly if environment variable isn't working
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  // Grid animation setup (same as LandingPage)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const gridX = useSpring(mouseX, {
    stiffness: 50,
    damping: 20,
    mass: 0.5,
  })
  const gridY = useSpring(mouseY, {
    stiffness: 50,
    damping: 20,
    mass: 0.5,
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      mouseX.set(((e.clientX - centerX) / centerX) * 20)
      mouseY.set(((e.clientY - centerY) / centerY) * 20)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])
  
  // Handle OAuth callback - simplified
  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const error = searchParams.get('error');
    
    if (token && email) {
      // Store authentication data and navigate immediately
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', email);
      navigate('/learning-chat');
    }
    // Silently ignore errors - no notifications
  }, [searchParams, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      // Specify the expected response type
      const response = await axios.get<GoogleAuthResponse>(`${API_URL}/auth/google`);
      const authUrl = response.data.auth_url;
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Grid background same as LandingPage */}
      <motion.div className="grid-background"
        style={{
          background: `
            linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)),
            url(${backgroundImage})
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1
        }}
      >
        <div className="black-overlay" />
        <motion.div
          className="grid-pattern"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "clamp(20px, 4vw, 40px) clamp(20px, 4vw, 40px)",
            x: gridX,
            y: gridY,
          }}
        />
        <div className="gradient-overlay" />
      </motion.div>

      <button 
        onClick={handleGoogleLogin} 
        disabled={isLoading}
        className="google-login-button"
      >
        <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isLoading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
};