import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Scanner from './pages/Scanner';
import Products from './pages/Products';
import Locations from './pages/Locations';
import Activity from './pages/Activity';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Navigate to="/scanner" replace />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/products" element={<Products />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/activity" element={<Activity />} />
        </Routes>
        <Navigation />
      </div>
    </Router>
  );
}

export default App;
