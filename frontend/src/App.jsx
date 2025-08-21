import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import useAuthStore from './store/AuthStore';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import PrivateRoute from './components/PrivateRoute';
import AuthService from './services/AuthService';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailInfo from './pages/VerifyEmailInfo';
import HierarchicalCategorySelector from './components/HierarchicalCategorySelector';
import DealsDashboard from './pages/DealsDashboard';
import { useCategoryStore } from './store/categoryStore';

// Placeholder Dashboard component
const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { categories, loading, error, fetchAllCategories } = useCategoryStore();
  
  // Récupérer les catégories depuis l'API au chargement du composant
  React.useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie!');
      navigate('/login');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };
  
  const storageType = AuthService.getStorageType();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">DealsMap</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Bonjour, {user?.first_name || user?.username}!
              </span>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  storageType === 'local' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {storageType === 'local' ? 'Persistant' : 'Session'}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">


        {/* Main Dashboard Content */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/dashboard/deals')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Gérer mes deals
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/deals')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Créer un nouveau deal
                  </button>
                </div>
              </div>

              {/* Statistics Preview */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-4">Statistiques</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Deals actifs:</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Vues totales:</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Conversions:</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-4">Activité récente</h3>
                <div className="text-sm text-purple-700">
                  <p>Connectez-vous à la gestion des deals pour voir votre activité récente.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/dashboard/deals')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Accéder à la gestion des deals →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
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
        // Silent error handling
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
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-info" element={<VerifyEmailInfo />} />

        {/* Category page */}
        {/* <Route path="/categories" element={<CategoryPage />} /> */}

        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Deals management routes */}
        <Route 
          path="/dashboard/deals" 
          element={
            <PrivateRoute>
              <DealsDashboard />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/dashboard/deals/:id/edit" 
          element={
            <PrivateRoute>
              <DealsDashboard />
            </PrivateRoute>
          } 
        />

        {/* Redirect root to dashboard if authenticated, otherwise to login */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Navigate to="/dashboard" replace />
            </PrivateRoute>
          } 
        />
        
        {/* Catch all route - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
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
