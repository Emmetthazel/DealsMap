import useAuthStore from '../store/AuthStore';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    rememberMe,
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    resetPassword,
    clearError,
    setRememberMe
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    rememberMe,
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    changePassword,
    resetPassword,
    clearError,
    setRememberMe
  };
};
