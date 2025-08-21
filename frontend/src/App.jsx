import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/AuthStore';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailInfo from './pages/VerifyEmailInfo';
import DealsDashboard from './pages/DealsDashboard';
import Dashboard from './pages/Dashboard';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Chargement...
      </h2>
      <p className="text-gray-600">
        Vérification de votre session
      </p>
    </div>
  </div>
);

const App = () => {
  const { initializeAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, [initializeAuth]);

  // Show loading screen while initializing
  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes without sidebar */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-info" element={<VerifyEmailInfo />} />

        {/* Test route - simple content */}
        <Route 
          path="/test" 
          element={
            <div className="min-h-screen bg-gray-50 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Test Page</h1>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">This is a test page to see if routing works.</p>
              </div>
            </div>
          } 
        />

        {/* Protected routes with sidebar */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } 
        />
        
        {/* Deals management routes */}
        <Route 
          path="/dashboard/deals" 
          element={
            <PrivateRoute>
              <Layout>
                <DealsDashboard />
              </Layout>
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/dashboard/deals/create" 
          element={
            <PrivateRoute>
              <Layout>
                <DealsDashboard />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Catch all route - redirect to dashboard if authenticated, otherwise to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </Router>
  );
};

export default App;
