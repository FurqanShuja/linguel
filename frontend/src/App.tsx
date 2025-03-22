import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Login } from './components/Login';
import { LearningChat } from './components/LearningChat';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/learning-chat" element={<LearningChat />} />
      </Routes>
    </Router>
  );
}

export default App;
