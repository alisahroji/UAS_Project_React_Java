import { api } from './api';

export const proposalService = {
  getProposals: async (jobId) => {
    return await api.get(`/api/jobs/${jobId}/proposals`);
  },

  getMyProposals: async () => {
    return await api.get('/api/proposals/me');
  },

  getProposalById: async (proposalId) => {
    return await api.get(`/api/proposals/${proposalId}`);
  },

  createProposal: async (jobId, proposalData) => {
    return await api.post(`/api/jobs/${jobId}/proposals`, proposalData);
  },

  withdrawProposal: async (proposalId) => {
    return await api.post(`/api/proposals/${proposalId}/withdraw`);
  },
};