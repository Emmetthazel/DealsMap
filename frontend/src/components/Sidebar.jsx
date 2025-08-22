import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/AuthStore';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthStore();

  console.log('Sidebar render:', { isAuthenticated, user, location: location.pathname });

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      path: '/home',
      icon: 'fas fa-home',
      label: 'Accueil',
      public: true,
      ownerOnly: false
    },
    {
      path: '/map',
      icon: 'fas fa-map',
      label: 'Carte Interactive',
      public: true,
      ownerOnly: false
    },
    {
      path: '/deals',
      icon: 'fas fa-tags',
      label: 'Liste des Deals',
      public: true,
      ownerOnly: false
    },
    {
      path: '/dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard Propriétaire',
      public: false,
      ownerOnly: true
    },
    {
      path: '/dashboard/deals',
      icon: 'fas fa-tags',
      label: 'Gérer mes Deals',
      public: false,
      ownerOnly: true
    },
    {
      path: '/dashboard/deals/create',
      icon: 'fas fa-percent',
      label: 'Créer un Deal',
      public: false,
      ownerOnly: true
    },
    {
      path: '/dashboard/business',
      icon: 'fas fa-store',
      label: 'Mon Établissement',
      public: false,
      ownerOnly: true
    },
    {
      path: '/profile',
      icon: 'fas fa-user',
      label: 'Mon Profil',
      public: false,
      ownerOnly: false
    },
    {
      path: '/client-dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard Client',
      public: false,
      ownerOnly: false,
      clientOnly: true
    }
  ];

  const publicNavItems = [
    {
      path: '/login',
      icon: 'fas fa-sign-in-alt',
      label: 'Connexion',
      public: true
    },
    {
      path: '/register',
      icon: 'fas fa-user-plus',
      label: 'Inscription',
      public: true
    }
  ];

  const renderNavItem = (item) => {
    // Show public items to everyone
    // Show private items only to authenticated users
    if (!item.public && !isAuthenticated) return null;
    
    // Don't show login/register to authenticated users
    if (item.public && isAuthenticated && (item.path === '/login' || item.path === '/register')) return null;
    
    // Hide owner-only items for client users
    if (item.ownerOnly && user?.user_type !== 'owner') return null;
    
    // Hide client-only items for owner users
    if (item.clientOnly && user?.user_type !== 'client') return null;

    return (
      <div
        key={item.path}
        className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
        onClick={() => navigate(item.path)}
      >
        <i className={item.icon}></i>
        {item.label}
      </div>
    );
  };

  return (
    <div className="sidebar">
      <h2>
        <i className="fas fa-map-marked-alt"></i> DealsMap
      </h2>
      
      {/* Main Navigation */}
      <div className="nav-section">
        {navItems.map(renderNavItem)}
      </div>

      {/* Public Navigation (Login/Register) */}
      {!isAuthenticated && (
        <div className="nav-section">
          {publicNavItems.map(renderNavItem)}
        </div>
      )}

      {/* User Info & Logout */}
      {isAuthenticated && (
        <div className="nav-section user-section">
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-details">
              <div className="user-name">{user?.first_name || 'Utilisateur'}</div>
              <div className="user-role">
                {user?.user_type === 'owner' ? 'Propriétaire' : 'Client'}
              </div>
            </div>
          </div>
          
          <div
            className="nav-item logout-item"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            Déconnexion
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
