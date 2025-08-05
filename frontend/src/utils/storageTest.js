// Utility functions to test token storage
import AuthService from '../services/AuthService';

export const testStorage = () => {
  console.log('=== Storage Test ===');
  
  // Test current storage type
  const storageType = AuthService.getStorageType();
  console.log('Current storage type:', storageType);
  
  // Test if authenticated
  const isAuth = AuthService.isAuthenticated();
  console.log('Is authenticated:', isAuth);
  
  // Test tokens
  const tokens = AuthService.getTokens();
  console.log('Tokens:', {
    access: tokens.access ? 'Present' : 'Missing',
    refresh: tokens.refresh ? 'Present' : 'Missing'
  });
  
  // Test storage contents
  console.log('localStorage auth items:', {
    access_token: localStorage.getItem('access_token') ? 'Present' : 'Missing',
    refresh_token: localStorage.getItem('refresh_token') ? 'Present' : 'Missing',
    auth_storage_type: localStorage.getItem('auth_storage_type')
  });
  
  console.log('sessionStorage auth items:', {
    access_token: sessionStorage.getItem('access_token') ? 'Present' : 'Missing',
    refresh_token: sessionStorage.getItem('refresh_token') ? 'Present' : 'Missing'
  });
  
  console.log('=== End Storage Test ===');
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  window.testStorage = testStorage;
} 