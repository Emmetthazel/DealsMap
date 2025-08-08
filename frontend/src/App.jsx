// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CategoryPage from './pages/categoryPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Bienvenue sur l'accueil</div>} />
        <Route path="/categories" element={<CategoryPage/>} />
        {/* Autres routes... */}
      </Routes>
    </Router>
  );
}

export default App;
