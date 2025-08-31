import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

const AdminModerationPanel = () => {
    const { user } = useAuth();
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [moderationReason, setModerationReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (user?.is_staff) {
            fetchPendingReviews();
        }
    }, [user]);

    const fetchPendingReviews = async () => {
        try {
            setLoading(true);
            const response = await apiService.get('/reviews/pending_moderation/');
            setPendingReviews(response.data);
        } catch (err) {
            setError('Failed to fetch pending reviews');
            console.error('Error fetching pending reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleModeration = async (action, reviewId) => {
        try {
            setActionLoading(true);
            const endpoint = action === 'approve' ? 'approve' : 'reject';
            const data = action === 'reject' ? { reason: moderationReason } : {};
            
            await apiService.post(`/reviews/${reviewId}/${endpoint}/`, data);
            
            // Remove the moderated review from the list
            setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
            setSelectedReview(null);
            setModerationReason('');
            
            // Show success message
            alert(`Review ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        } catch (err) {
            setError(`Failed to ${action} review`);
            console.error(`Error ${action}ing review:`, err);
        } finally {
            setActionLoading(false);
        }
    };

    const openModerationModal = (review) => {
        setSelectedReview(review);
        setModerationReason('');
    };

    const closeModerationModal = () => {
        setSelectedReview(null);
        setModerationReason('');
    };

    if (!user?.is_staff) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
                <p className="text-red-600">You don't have permission to access the moderation panel.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-center mt-2 text-gray-600">Loading pending reviews...</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Review Moderation Panel</h2>
                <button
                    onClick={fetchPendingReviews}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            <div className="mb-4">
                <p className="text-gray-600">
                    {pendingReviews.length} review(s) pending moderation
                </p>
            </div>

            {pendingReviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>No reviews pending moderation</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingReviews.map((review) => (
                        <div
                            key={review.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        Review by {review.user?.username || 'Unknown User'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {review.business_name || review.deal_title}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <span
                                                key={i}
                                                className={`text-lg ${
                                                    i < review.rating
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-600">{review.rating}/5</p>
                                </div>
                            </div>

                            <div className="mb-3">
                                <p className="text-gray-700">{review.comment}</p>
                            </div>

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleModeration('approve', review.id)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => openModerationModal(review)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading ? 'Rejecting...' : 'Reject'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Moderation Modal */}
            {selectedReview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Reject Review</h3>
                        <p className="text-gray-600 mb-4">
                            Please provide a reason for rejecting this review:
                        </p>
                        <textarea
                            value={moderationReason}
                            onChange={(e) => setModerationReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none"
                            rows="3"
                        />
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleModeration('reject', selectedReview.id)}
                                disabled={actionLoading || !moderationReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {actionLoading ? 'Rejecting...' : 'Reject Review'}
                            </button>
                            <button
                                onClick={closeModerationModal}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminModerationPanel;
