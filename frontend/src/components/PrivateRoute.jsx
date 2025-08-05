import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useAuthStore from '../store/AuthStore';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Vérification...
          </h2>
          <p className="text-gray-600">
            Vérification de votre authentification
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('🔒 Access denied, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show children if authenticated
  console.log('✅ Access granted');
  return children;
};

export default PrivateRoute; 