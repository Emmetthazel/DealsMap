import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

const OwnerResponseForm = ({ review, onResponseSubmitted, onCancel }) => {
    const { user } = useAuth();
    const [responseText, setResponseText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!responseText.trim()) {
            setError('Response text cannot be empty');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            
            await apiService.post(`/reviews/${review.id}/owner_response/`, {
                response: responseText.trim()
            });
            
            // Clear form and notify parent
            setResponseText('');
            onResponseSubmitted();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit response');
            console.error('Error submitting owner response:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        setResponseText('');
        setError(null);
        onCancel();
    };

    // Check if user owns the business or deal
    const canRespond = review && (
        (review.business && review.business.owner === user?.id) ||
        (review.deal && review.deal.business?.owner === user?.id)
    );

    if (!canRespond) {
        return null;
    }

    return (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3">Respond to Review</h4>
            
            {error && (
                <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response to this review..."
                    className="w-full p-3 border border-blue-300 rounded-lg mb-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    maxLength="1000"
                />
                
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        {responseText.length}/1000 characters
                    </span>
                    
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !responseText.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Submitting...' : 'Submit Response'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default OwnerResponseForm;
