import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Main application entry point

// // Clear any stale authentication tokens on app startup
// const clearStaleTokens = () => {
//   const storageKeys = ['access_token', 'refresh_token', 'auth_storage_type'];
//   storageKeys.forEach(key => {
//     localStorage.removeItem(key);
//     sessionStorage.removeItem(key);
//   });
//   console.log('Cleared stale authentication tokens');
// };

// // Clear tokens on startup
// clearStaleTokens();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
