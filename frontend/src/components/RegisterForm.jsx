import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/AuthStore';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    user_type: 'client',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
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
    
    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Le nom d\'utilisateur est requis';
    } else if (formData.username.length < 3) {
      errors.username = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Veuillez entrer un email valide';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }
    
    // Password confirmation validation
    if (!formData.password_confirm) {
      errors.password_confirm = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.password_confirm) {
      errors.password_confirm = 'Les mots de passe ne correspondent pas';
    }
    
    // First name validation
    if (!formData.first_name.trim()) {
      errors.first_name = 'Le prénom est requis';
    }
    
    // Last name validation
    if (!formData.last_name.trim()) {
      errors.last_name = 'Le nom de famille est requis';
    }
    
    // Phone validation (optional but if provided, validate format)
    if (formData.phone && !/^[0-9+\-\s()]+$/.test(formData.phone)) {
      errors.phone = 'Veuillez entrer un numéro de téléphone valide';
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
      await register(formData);
      toast.success('Inscription réussie!');
      navigate('/dashboard'); // Redirect to dashboard after successful registration
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
        </div>

        {/* User Type Selection */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, user_type: 'client' }))}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-base font-medium transition-colors ${
              formData.user_type === 'client'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
            }`}
          >
            <i className="fas fa-user mr-2"></i>
            Utilisateur
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, user_type: 'owner' }))}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-base font-medium transition-colors ${
              formData.user_type === 'owner'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
            }`}
          >
            <i className="fas fa-store mr-2"></i>
            Propriétaire
          </button>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  className={`w-full px-3 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.first_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Votre prénom"
                  value={formData.first_name}
                  onChange={handleInputChange}
                />
                {validationErrors.first_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.first_name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  className={`w-full px-3 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.last_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Votre nom"
                  value={formData.last_name}
                  onChange={handleInputChange}
                />
                {validationErrors.last_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`w-full px-3 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleInputChange}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`w-full px-3 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+212 6XX XXX XXX"
                value={formData.phone}
                onChange={handleInputChange}
              />
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.phone}
                </p>
              )}
            </div>

                         {/* Username */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Nom d'utilisateur
               </label>
               <input
                 id="username"
                 name="username"
                 type="text"
                 required
                 className={`w-full px-3 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                   validationErrors.username ? 'border-red-300' : 'border-gray-300'
                 }`}
                 placeholder="Nom d'utilisateur"
                 value={formData.username}
                 onChange={handleInputChange}
               />
               {validationErrors.username && (
                 <p className="mt-1 text-sm text-red-600">
                   {validationErrors.username}
                 </p>
               )}
             </div>

            {/* Password */}
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
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Minimum 8 caractères"
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

            {/* Password Confirm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  required
                  className={`w-full px-3 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 ${
                    validationErrors.password_confirm ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Retapez votre mot de passe"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.password_confirm && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.password_confirm}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer text-sm leading-relaxed">
              <input 
                type="checkbox" 
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                required 
              />
              <span>
                J'accepte les <a href="#" className="text-blue-600 hover:text-blue-500">conditions d'utilisation</a> et la <a href="#" className="text-blue-600 hover:text-blue-500">politique de confidentialité</a>
              </span>
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erreur d'inscription
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
                Inscription en cours...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus mr-2"></i>
                Créer mon compte
              </>
            )}
          </button>

          <div className="text-center">
            <span className="text-gray-500">Déjà un compte ?</span>
            <Link
              to="/login"
              className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
            >
              Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm; 