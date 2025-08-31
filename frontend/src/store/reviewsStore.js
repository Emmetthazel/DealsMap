import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import ReviewService from '../services/ReviewService';

const useReviewsStore = create(
  devtools(
    persist(
      (set, get) => ({
        // State
        reviews: [],
        businessReviews: {},
        dealReviews: {},
        myReviews: [],
        pendingReviews: [],
        reviewStats: {},
        savedFilters: [],
        isLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasMore: true,

        // Actions
        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),

        // Fetch all reviews with filters
        fetchReviews: async (filters = {}, page = 1) => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await ReviewService.getReviews({ ...filters, page });
            
            if (page === 1) {
              set({ 
                reviews: response.results || response,
                currentPage: page,
                totalPages: response.count ? Math.ceil(response.count / 10) : 1,
                hasMore: response.next ? true : false
              });
            } else {
              set(state => ({
                reviews: [...state.reviews, ...(response.results || response)],
                currentPage: page,
                hasMore: response.next ? true : false
              }));
            }
          } catch (error) {
            set({ error: error.message });
            console.error('Error fetching reviews:', error);
          } finally {
            set({ isLoading: false });
          }
        },

        // Fetch reviews for a specific business
        fetchBusinessReviews: async (businessId) => {
          try {
            set({ isLoading: true, error: null });
            
            const reviews = await ReviewService.getBusinessReviews(businessId);
            
            set(state => ({
              businessReviews: {
                ...state.businessReviews,
                [businessId]: reviews
              }
            }));
            
            return reviews;
          } catch (error) {
            set({ error: error.message });
            console.error('Error fetching business reviews:', error);
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Fetch reviews for a specific deal
        fetchDealReviews: async (dealId) => {
          try {
            set({ isLoading: true, error: null });
            
            const reviews = await ReviewService.getDealReviews(dealId);
            
            set(state => ({
              dealReviews: {
                ...state.dealReviews,
                [dealId]: reviews
              }
            }));
            
            return reviews;
          } catch (error) {
            set({ error: error.message });
            console.error('Error fetching deal reviews:', error);
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Fetch current user's reviews
        fetchMyReviews: async () => {
          try {
            set({ isLoading: true, error: null });
            
            const reviews = await ReviewService.getMyReviews();
            set({ myReviews: reviews });
            
            return reviews;
          } catch (error) {
            set({ error: error.message });
            console.error('Error fetching my reviews:', error);
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Fetch review statistics
        fetchReviewStats: async (businessId = null, dealId = null) => {
          try {
            set({ isLoading: true, error: null });
            
            const stats = await ReviewService.getReviewStats(businessId, dealId);
            
            const key = businessId ? `business_${businessId}` : dealId ? `deal_${dealId}` : 'general';
            set(state => ({
              reviewStats: {
                ...state.reviewStats,
                [key]: stats
              }
            }));
            
            return stats;
          } catch (error) {
            set({ error: error.message });
            console.error('Error fetching review stats:', error);
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Create a new review
        createReview: async (reviewData) => {
          try {
            set({ isLoading: true, error: null });
            
            console.log('🔄 Creating review with data:', reviewData);
            const newReview = await ReviewService.createReview(reviewData);
            console.log('✅ Review created, response:', newReview);
            
            // Add to appropriate lists
            set(state => {
              const updatedReviews = [newReview, ...state.reviews];
              const updatedMyReviews = [newReview, ...state.myReviews];
              
              let updatedBusinessReviews = { ...state.businessReviews };
              let updatedDealReviews = { ...state.dealReviews };
              
              if (newReview.business) {
                const businessId = newReview.business;
                console.log('🔄 Updating business reviews for:', businessId);
                updatedBusinessReviews[businessId] = [
                  newReview,
                  ...(updatedBusinessReviews[businessId] || [])
                ];
              }
              
              if (newReview.deal) {
                const dealId = newReview.deal;
                console.log('🔄 Updating deal reviews for:', dealId);
                updatedDealReviews[dealId] = [
                  newReview,
                  ...(updatedDealReviews[dealId] || [])
                ];
              }
              
              return {
                reviews: updatedReviews,
                myReviews: updatedMyReviews,
                businessReviews: updatedBusinessReviews,
                dealReviews: updatedDealReviews
              };
            });
            
            return newReview;
          } catch (error) {
            set({ error: error.message });
            console.error('Error creating review:', error);
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Update an existing review
        updateReview: async (reviewId, reviewData) => {
          try {
            set({ isLoading: true, error: null });
            
            const updatedReview = await ReviewService.updateReview(reviewId, reviewData);
            
            // Update in all lists
            set(state => {
              const updateReviewInList = (list) =>
                list.map(review => review.id === reviewId ? updatedReview : review);
              
              const updatedReviews = updateReviewInList(state.reviews);
              const updatedMyReviews = updateReviewInList(state.myReviews);
              
              let updatedBusinessReviews = { ...state.businessReviews };
              let updatedDealReviews = { ...state.dealReviews };
              
              // Update in business reviews
              Object.keys(updatedBusinessReviews).forEach(businessId => {
                updatedBusinessReviews[businessId] = updateReviewInList(updatedBusinessReviews[businessId]);
              });
              
              // Update in deal reviews
              Object.keys(updatedDealReviews).forEach(dealId => {
                updatedDealReviews[dealId] = updateReviewInList(updatedDealReviews[dealId]);
              });
              
              return {
                reviews: updatedReviews,
                myReviews: updatedMyReviews,
                businessReviews: updatedBusinessReviews,
                dealReviews: updatedDealReviews
              };
            });
            
            return updatedReview;
          } catch (error) {
            set({ error: error.message });
            console.error('Error updating review:', error);
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Delete a review
        deleteReview: async (reviewId) => {
          try {
            set({ isLoading: true, error: null });
            
            await ReviewService.deleteReview(reviewId);
            
            // Remove from all lists
            set(state => {
              const removeReviewFromList = (list) =>
                list.filter(review => review.id !== reviewId);
              
              const updatedReviews = removeReviewFromList(state.reviews);
              const updatedMyReviews = removeReviewFromList(state.myReviews);
              
              let updatedBusinessReviews = { ...state.businessReviews };
              let updatedDealReviews = { ...state.dealReviews };
              
              // Remove from business reviews
              Object.keys(updatedBusinessReviews).forEach(businessId => {
                updatedBusinessReviews[businessId] = removeReviewFromList(updatedBusinessReviews[businessId]);
              });
              
              // Remove from deal reviews
              Object.keys(updatedDealReviews).forEach(dealId => {
                updatedDealReviews[dealId] = removeReviewFromList(updatedDealReviews[dealId]);
              });
              
              return {
                reviews: updatedReviews,
                myReviews: updatedMyReviews,
                businessReviews: updatedBusinessReviews,
                dealReviews: updatedDealReviews
              };
            });
            
            return true;
          } catch (error) {
            set({ error: error.message });
            console.error('Error deleting review:', error);
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        // Save filters
        saveFilters: (filterName, filters) => {
          const savedFilter = {
            id: Date.now(),
            name: filterName,
            filters,
            createdAt: new Date().toISOString()
          };
          
          set(state => ({
            savedFilters: [...state.savedFilters, savedFilter]
          }));
          
          return savedFilter;
        },

        // Load saved filters
        loadFilters: (filterId) => {
          const state = get();
          const savedFilter = state.savedFilters.find(f => f.id === filterId);
          return savedFilter ? savedFilter.filters : null;
        },

        // Delete saved filters
        deleteSavedFilters: (filterId) => {
          set(state => ({
            savedFilters: state.savedFilters.filter(f => f.id !== filterId)
          }));
        },

        // Clear all reviews
        clearReviews: () => {
          set({
            reviews: [],
            businessReviews: {},
            dealReviews: {},
            myReviews: [],
            pendingReviews: [],
            reviewStats: {},
            currentPage: 1,
            totalPages: 1,
            hasMore: true
          });
        },

        // Get reviews by business ID
        getReviewsByBusiness: (businessId) => {
          const state = get();
          return state.businessReviews[businessId] || [];
        },

        // Get reviews by deal ID
        getReviewsByDeal: (dealId) => {
          const state = get();
          return state.dealReviews[dealId] || [];
        },

        // Get review stats by business or deal
        getReviewStats: (businessId = null, dealId = null) => {
          const state = get();
          const key = businessId ? `business_${businessId}` : dealId ? `deal_${dealId}` : 'general';
          return state.reviewStats[key] || null;
        },

        // Check if user has reviewed
        hasUserReviewed: (businessId = null, dealId = null) => {
          const state = get();
          const myReviews = state.myReviews;
          
          return myReviews.some(review => 
            (businessId && review.business === businessId) ||
            (dealId && review.deal === dealId)
          );
        }
      }),
      {
        name: 'reviews-storage',
        partialize: (state) => ({
          savedFilters: state.savedFilters
        })
      }
    )
  )
);

export default useReviewsStore;
