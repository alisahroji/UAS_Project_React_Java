import { api } from './api';

export const offerService = {
  getOffers: async (proposalId) => {
    return await api.get(`/api/proposals/${proposalId}/offers`);
  },

  createOffer: async (proposalId, offerData) => {
    return await api.post(`/api/proposals/${proposalId}/offers`, offerData);
  },

  acceptOffer: async (proposalId, offerId) => {
    return await api.post(`/api/proposals/${proposalId}/offers/${offerId}/accept`);
  },

  rejectOffer: async (proposalId, offerId) => {
    return await api.post(`/api/proposals/${proposalId}/offers/${offerId}/reject`);
  },
};