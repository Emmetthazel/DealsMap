import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/AuthStore';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Le nom d\'utilisateur est requis';
    }
    
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(formData, rememberMe);
      toast.success('Connexion réussie!');
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (error) {
      // Error is handled by the store
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center text-3xl font-bold text-blue-600 mb-2">
            <i className="fas fa-map-marked-alt mr-2"></i>
            DealsMap
          </div>
          <p className="text-gray-600">Connectez-vous pour découvrir les meilleurs deals</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur ou email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`w-full px-3 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.username 
                    ? 'border-red-300' 
                    : 'border-gray-300'
                }`}
                placeholder="votre@email.com"
                value={formData.username}
                onChange={handleInputChange}
              />
              {validationErrors.username && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.username}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`w-full px-3 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                    validationErrors.password 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.password}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
            </label>
            <Link
              to="#"
              className="text-sm text-blue-600 hover:text-blue-500"
              onClick={e => {
                e.preventDefault();
                alert("Pas encore implémenté");
              }}
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erreur de connexion
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Connexion en cours...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt mr-2"></i>
                Se connecter
              </>
            )}
          </button>

          <div className="text-center">
            <span className="text-gray-500">ou</span>
          </div>

          <button
            type="button"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => alert("Pas encore implémenté")}
          >
            <i className="fab fa-facebook-f mr-2 text-blue-600"></i>
            Continuer avec Facebook
          </button>

          <button
            type="button"
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => alert("Pas encore implémenté")}
          >
            <i className="fab fa-google mr-2 text-red-600"></i>
            Continuer avec Google
          </button>

          <div className="text-center">
            <span className="text-gray-500">Pas encore de compte ?</span>
            <Link
              to="/register"
              className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
            >
              Créer un compte
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;