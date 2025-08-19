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
    } catch (error) {
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
        {/* Sélecteur de catégories hiérarchique au-dessus du tableau de bord */}
        <div className="mb-6 px-4 sm:px-0">
          <div className="w-[35%] bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement des catégories...</span>
              </div>
            ) : error ? (
              <div className="text-red-600 text-center py-4">
                Erreur lors du chargement des catégories: {error}
              </div>
            ) : (
              <HierarchicalCategorySelector
                categories={categories}
                onSelect={(category) => {
                  console.log("Catégorie sélectionnée:", category);
                  // Ici vous pouvez ajouter la logique de filtrage du tableau de bord
                }}
                selectedCategories={null}
                multiple={false}
                placeholder="Choisir une catégorie pour filtrer..."
                className="w-full"
              />
            )}
          </div>
        </div>


        
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500 text-lg">
              Contenu du tableau de bord à venir...
            </p>
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
        console.error('App initialization failed:', error);
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

