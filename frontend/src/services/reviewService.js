import { api } from './api';

export const reviewService = {
  createReview: async (projectId, { rating, comment }) => {
    return await api.post(`/api/projects/${projectId}/reviews`, { rating, comment });
  },

  getProjectReviews: async (projectId) => {
    return await api.get(`/api/projects/${projectId}/reviews`);
  },

  getUserReviews: async (userId) => {
    return await api.get(`/api/users/${userId}/reviews`);
  },
};
