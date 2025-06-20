import { motion, useMotionValue, useSpring } from "framer-motion"
import { ArrowRight, Check, Users, BookOpen, Clock, Instagram, Linkedin, Youtube } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import axios from 'axios'
import "./LandingPage.css"
import logo from "../assets/images/logo.png";
import backgroundImage from "../assets/images/background_image.jpg";

// Define types for button props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'ghost';
}

// Define types for card props
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// Define the expected response type for Google auth
interface GoogleAuthResponse {
  auth_url: string;
}

// Button component with proper typing
function Button({ children, className = "", size = "default", variant = "default", ...props }: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"

  const sizeStyles = {
    default: "h-10 py-2 px-4 text-sm",
    sm: "h-9 px-3 text-xs",
    lg: "h-11 px-8 text-base",
  } as const

  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  } as const

  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`

  return (
    <button className={combinedClassName} {...props}>
      {children}
    </button>
  )
}

// Card components with proper typing
function Card({ className = "", ...props }: CardProps) {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
}

function CardHeader({ className = "", ...props }: CardProps) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
}

function CardTitle({ className = "", ...props }: CardProps) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
}

function CardContent({ className = "", ...props }: CardProps) {
  return <div className={`p-6 pt-0 ${className}`} {...props} />
}

function CardFooter({ className = "", ...props }: CardProps) {
  return <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
}

// TypeWriter component with proper typing
interface TypeWriterProps {
  text: string;
  delay?: number;
  className?: string;
  startDelay?: number;
}

function TypeWriter({ text, delay = 75, className = "", startDelay = 0 }: TypeWriterProps) {
  const [displayText, setDisplayText] = useState("")

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const startTyping = () => {
      let currentIndex = 0
      const typeChar = () => {
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1))
          currentIndex++
          timeoutId = setTimeout(typeChar, delay)
        }
      }
      timeoutId = setTimeout(typeChar, delay)
    }

    const initialDelay = setTimeout(startTyping, startDelay)

    return () => {
      clearTimeout(initialDelay)
      clearTimeout(timeoutId)
    }
  }, [text, delay, startDelay])

  return displayText
}

// useCountUp hook
function useCountUp(end: number, duration = 2) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1)
      setValue(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [end, duration])

  return value
}

// Footer component
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <span className="logo-text">
            <span className="logo-part-two">Langey</span>
          </span>
        </div>

        <div className="social-links">
          <a href="https://youtube.com" className="social-link">
            <Youtube className="h-5 w-5" />
          </a>
          <a href="https://instagram.com" className="social-link">
            <Instagram className="h-5 w-5" />
          </a>
          <a href="https://linkedin.com" className="social-link">
            <Linkedin className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  )
}

const howItWorks = [
  {
    title: "Choose Your Level",
    description: "Start with a quick assessment to determine your current German proficiency level."
  },
  {
    title: "Practice with AI",
    description: "Engage in natural conversations with our AI tutor tailored to your level."
  },
  {
    title: "Track Progress",
    description: "Monitor your improvement with detailed progress tracking and analytics."
  }
]

// Change the export to named export
export { LandingPage };

// Change the function declaration
function LandingPage() {
  const targetRef = useRef(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Login state
  const [showGoogleLogin, setShowGoogleLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Define the API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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
  
  // Handle OAuth callback
  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (token && email) {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userEmail', email);
      navigate('/learning-chat');
    }
  }, [searchParams, navigate]);
  
  const handleLoginClick = () => {
    setShowGoogleLogin(true)
  }
  
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      const response = await axios.get<GoogleAuthResponse>(`${API_URL}/auth/google`);
      const authUrl = response.data.auth_url;
      window.location.href = authUrl;
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const usersCount = useCountUp(1234)
  const vocabularyCount = useCountUp(5678)
  const timeCount = useCountUp(9876)

  return (
    <div ref={targetRef} className="landing-container">
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

      <div className="content">
        <section className="hero-section">
          <div className="hero-content">
            <div className="logo-container-hero">
              <img 
                src={logo} 
                alt="Langey Logo" 
                className="hero-logo"
              />
            </div>
            <h1 className="hero-title">
              <span className="ai-text">
                <TypeWriter text="Learn German with Langey" delay={50} />
                <span className="cursor-blink" />
              </span>
            </h1>
            <p className="hero-description">
              The fastest and most effective way to learn German with AI
            </p>
            <div className="hero-buttons">
              {!showGoogleLogin ? (
                <>
                  <Button
                    size="lg"
                    className="login-button"
                    onClick={handleLoginClick}
                  >
                    Login
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="signup-button"
                    onClick={handleLoginClick}
                  >
                    Get Started
                  </Button>
                </>
              ) : (
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
              )}
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stats-content">
            <div className="stats-header">
              <h2>Our Impact in Numbers</h2>
              <p>See how we're transforming language learning worldwide</p>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <Users className="stat-icon" />
                <div className="stat-value">{usersCount.toLocaleString()}</div>
                <p className="stat-label">Active Users</p>
              </div>
              <div className="stat-card">
                <BookOpen className="stat-icon" />
                <div className="stat-value">{vocabularyCount.toLocaleString()}</div>
                <p className="stat-label">Vocabulary/Grammar Learned</p>
              </div>
              <div className="stat-card">
                <Clock className="stat-icon" />
                <div className="stat-value">{timeCount.toLocaleString()}</div>
                <p className="stat-label">Total Hours Learning</p>
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works-section">
          <div className="section-content">
            <div className="section-header">
              <h2>How It Works</h2>
              <p>Learn German effectively with our AI-powered approach</p>
            </div>
            <div className="steps-grid">
              {howItWorks.map((step, index) => (
                <Card
                  key={step.title}
                  className="step-card"
                >
                  <div className="step-number">{index + 1}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="pricing-section">
          <div className="section-content">
            <div className="section-header">
              <h2>Simple and Transparent Pricing</h2>
              <p>Choose the ideal plan for your needs. Always know what you'll pay.</p>
            </div>
            <div className="pricing-grid">
              <Card className="pricing-card">
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <p>Start learning German</p>
                </CardHeader>
                <CardContent>
                  <div className="price">
                    <span className="amount">$0</span>
                    <span className="period">/month</span>
                  </div>
                  <ul className="features-list">
                    <li>
                      <Check className="feature-icon" />
                      <span>Basic conversation practice</span>
                    </li>
                    <li>
                      <Check className="feature-icon" />
                      <span>Limited vocabulary exercises</span>
                    </li>
                    <li>
                      <Check className="feature-icon" />
                      <span>Grammar basics</span>
                    </li>
                    <li className="disabled-feature">
                      <span className="cross-icon">✕</span>
                      <span>Advanced conversation scenarios</span>
                    </li>
                    <li className="disabled-feature">
                      <span className="cross-icon">✕</span>
                      <span>Personalized learning path</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="pricing-button">
                    Get Started
                  </Button>
                </CardFooter>
              </Card>

              <Card className="pricing-card pro">
                <div className="popular-tag">Most Popular</div>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <p>For serious language learners</p>
                </CardHeader>
                <CardContent>
                  <div className="price">
                    <span className="amount">$9.99</span>
                    <span className="period">/ month</span>
                  </div>
                  <ul className="features-list">
                    <li>
                      <Check className="feature-icon" />
                      All Free features
                    </li>
                    <li>
                      <Check className="feature-icon" />
                      Unlimited conversation scenarios
                    </li>
                    <li>
                      <Check className="feature-icon" />
                      Unlimited vocabulary flashcards
                    </li>
                    <li>
                      <Check className="feature-icon" />
                      Grammar correction & explanations
                    </li>
                    <li>
                      <Check className="feature-icon" />
                      Priority support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="pricing-button">
                    Upgrade to Pro
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}
