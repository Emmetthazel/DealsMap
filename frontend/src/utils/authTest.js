// Test utilities for authentication functionality
import AuthService from '../services/AuthService';

export const testAutoLogin = async () => {
  console.log('🧪 Testing Auto-Login Functionality');
  console.log('=====================================');
  
  // Test 1: Check if tokens exist
  const isAuth = AuthService.isAuthenticated();
  const storageType = AuthService.getStorageType();
  const tokens = AuthService.getTokens();
  
  console.log('📊 Current State:');
  console.log('- Is Authenticated:', isAuth);
  console.log('- Storage Type:', storageType);
  console.log('- Access Token:', tokens.access ? 'Present' : 'Missing');
  console.log('- Refresh Token:', tokens.refresh ? 'Present' : 'Missing');
  
  // Test 2: Try to get user profile
  if (isAuth) {
    try {
      console.log('🔍 Attempting to fetch user profile...');
      const user = await AuthService.getProfile();
      console.log('✅ Profile fetch successful:', user);
      return { success: true, user };
    } catch (error) {
      console.log('❌ Profile fetch failed:', error.message);
      return { success: false, error: error.message };
    }
  } else {
    console.log('❌ No authentication tokens found');
    return { success: false, error: 'No tokens found' };
  }
};

export const simulatePageReload = () => {
  console.log('🔄 Simulating page reload...');
  console.log('💡 Close this tab and reopen the app to test auto-login');
  
  // Show current storage state
  console.log('📦 Current Storage State:');
  console.log('localStorage:', {
    access_token: localStorage.getItem('access_token') ? 'Present' : 'Missing',
    refresh_token: localStorage.getItem('refresh_token') ? 'Present' : 'Missing',
    auth_storage_type: localStorage.getItem('auth_storage_type')
  });
  
  console.log('sessionStorage:', {
    access_token: sessionStorage.getItem('access_token') ? 'Present' : 'Missing',
    refresh_token: sessionStorage.getItem('refresh_token') ? 'Present' : 'Missing'
  });
};

export const clearAllAuth = () => {
  console.log('🧹 Clearing all authentication data...');
  
  // Clear localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth_storage_type');
  
  // Clear sessionStorage
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  
  // Clear Zustand store
  localStorage.removeItem('auth-storage');
  
  console.log('✅ All auth data cleared');
  console.log('🔄 Refresh the page to see the login form');
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  window.testAutoLogin = testAutoLogin;
  window.simulatePageReload = simulatePageReload;
  window.clearAllAuth = clearAllAuth;
} 