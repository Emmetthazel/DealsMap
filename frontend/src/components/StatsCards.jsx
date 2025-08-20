import React, { useState, useEffect, useCallback } from 'react';
import BusinessService from '../services/BusinessService.js';

const StatsCards = ({ businessId = null, refreshTrigger = 0 }) => {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalDeals: 0,
    activeDeals: 0,
    totalViews: 0,
    averageRating: 0,
    nearbyBusinesses: 0,
    businessStats: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, [businessId, refreshTrigger, fetchStats]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      if (businessId) {
        // Fetch specific business stats
        const businessStats = await BusinessService.getBusinessStats(businessId);
        setStats(prev => ({
          ...prev,
          businessStats
        }));
      } else {
        // Fetch general stats (you might need to create this endpoint)
        // For now, using mock data
        setStats({
          totalBusinesses: 156,
          activeBusinesses: 142,
          totalDeals: 89,
          activeDeals: 67,
          totalViews: 1247,
          averageRating: 4.2,
          nearbyBusinesses: 23,
          businessStats: null
        });
      }
    } catch (error) {
      setError('Failed to load statistics');
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const StatCard = ({ title, value, subtitle, icon, color, trend = null }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {typeof value === 'number' && value >= 1000 
                ? (value / 1000).toFixed(1) + 'k' 
                : value}
            </p>
            {trend && (
              <span className={`ml-2 text-sm font-medium ${
                trend > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-red-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading statistics
            </h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Businesses"
          value={stats.totalBusinesses}
          subtitle="Registered establishments"
          icon="🏢"
          color="border-l-blue-500"
          trend={5.2}
        />
        
        <StatCard
          title="Active Deals"
          value={stats.activeDeals}
          subtitle="Currently available"
          icon="🎯"
          color="border-l-green-500"
          trend={12.8}
        />
        
        <StatCard
          title="Total Views"
          value={stats.totalViews}
          subtitle="This month"
          icon="👁️"
          color="border-l-purple-500"
          trend={-2.1}
        />
        
        <StatCard
          title="Average Rating"
          value={stats.averageRating}
          subtitle="Out of 5 stars"
          icon="⭐"
          color="border-l-yellow-500"
          trend={0.3}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Active Businesses"
          value={stats.activeBusinesses}
          subtitle={`${((stats.activeBusinesses / stats.totalBusinesses) * 100).toFixed(1)}% of total`}
          icon="✅"
          color="border-l-green-500"
        />
        
        <StatCard
          title="Nearby Businesses"
          value={stats.nearbyBusinesses}
          subtitle="Within 10km radius"
          icon="📍"
          color="border-l-indigo-500"
        />
      </div>

      {/* Business-specific stats if viewing a specific business */}
      {businessId && stats.businessStats && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Business Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.businessStats.deals_count || 0}
              </p>
              <p className="text-sm text-gray-600">Total Deals</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.businessStats.views_count || 0}
              </p>
              <p className="text-sm text-gray-600">Profile Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {stats.businessStats.rating || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            📊 View Detailed Analytics
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
            📈 Export Report
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
