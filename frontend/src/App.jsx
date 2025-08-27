import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import DealsDashboard from './pages/DealsDashboard';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import BusinessForm from './components/BusinessForm';
import DealsList from './pages/DealsList';
import MapPage from './pages/MapPage';
import Layout from './components/Layout';
import { PrivateRoute, OwnerRoute } from './components/PrivateRoute';
import useAuthStore from './store/AuthStore';

const App = () => {
  const { initializeAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Component to handle redirects based on user type - moved inside App
  const UserTypeRedirect = () => {
    const { user } = useAuthStore();
    
    if (user?.user_type === 'owner') {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/client-dashboard" replace />;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [initializeAuth]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        
        {/* Test route */}
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

        {/* Main dashboard - Owner only */}
        <Route 
          path="/" 
          element={
            <OwnerRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </OwnerRoute>
          } 
        />
        
        {/* Deals management routes - Owner only */}
        <Route 
          path="/dashboard/deals" 
          element={
            <OwnerRoute>
              <Layout>
                <DealsDashboard />
              </Layout>
            </OwnerRoute>
          } 
        />
        
        <Route 
          path="/dashboard/deals/create" 
          element={
            <OwnerRoute>
              <Layout>
                <DealsDashboard />
              </Layout>
            </OwnerRoute>
          } 
        />

        {/* Profile route */}
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Business management route */}
        <Route 
          path="/dashboard/business" 
          element={
            <OwnerRoute>
              <Layout>
                <BusinessForm />
              </Layout>
            </OwnerRoute>
          } 
        />

        {/* Client dashboard route */}
        <Route 
          path="/client-dashboard" 
          element={
            <PrivateRoute>
              <Layout>
                <div className="min-h-screen bg-gray-50 p-6">
                  <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Client</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Rechercher des Deals</h3>
                        <p className="text-gray-600 mb-4">Trouvez les meilleures offres près de chez vous</p>
                        <a 
                          href="/deals"
                          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                          Voir les Deals
                        </a>
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Carte Interactive</h3>
                        <p className="text-gray-600 mb-4">Explorez les deals sur une carte</p>
                        <a 
                          href="/map"
                          className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                        >
                          Ouvrir la Carte
                        </a>
                      </div>
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Mon Profil</h3>
                        <p className="text-gray-600 mb-4">Gérez vos informations personnelles</p>
                        <a 
                          href="/profile"
                          className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                        >
                          Voir le Profil
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </Layout>
            </PrivateRoute>
          } 
        />

        {/* Public deals list route */}
        <Route 
          path="/deals" 
          element={
            <Layout>
              <DealsList />
            </Layout>
          } 
        />

        {/* Interactive map route */}
        <Route 
          path="/map" 
          element={
            <Layout>
              <MapPage />
            </Layout>
          } 
        />

        {/* Public home route */}
        <Route 
          path="/home" 
          element={
            <Layout>
              <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">
                    <i className="fas fa-home mr-3"></i>
                    Bienvenue sur DealsMap
                  </h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Découvrez les Meilleurs Deals</h3>
                      <p className="text-gray-600 mb-4">Trouvez des offres exceptionnelles près de chez vous</p>
                      <a 
                        href="/deals"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                      >
                        Voir les Deals
                      </a>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Explorez la Carte</h3>
                      <p className="text-gray-600 mb-4">Visualisez les deals sur une carte interactive</p>
                      <a 
                        href="/map"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                      >
                        Ouvrir la Carte
                      </a>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Créez votre Établissement</h3>
                      <p className="text-gray-600 mb-4">Propriétaires, rejoignez DealsMap pour promouvoir vos offres</p>
                      <a 
                        href="/register"
                        className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                      >
                        S'inscrire
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Layout>
          } 
        />

        {/* Catch all route - redirect based on user type */}
        <Route path="*" element={<UserTypeRedirect />} />
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
