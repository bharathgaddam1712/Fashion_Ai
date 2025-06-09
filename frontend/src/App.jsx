import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Home from './pages/Home.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;