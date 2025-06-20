import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LearningChat } from './components/LearningChat';
import { LandingPage } from './components/LandingPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/learning-chat" element={<LearningChat />} />
      </Routes>
    </Router>
  );
}

export default App;
