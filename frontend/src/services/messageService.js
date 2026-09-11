import { api } from './api';

export const messageService = {
  getMessages: async (proposalId) => {
    return await api.get(`/api/proposals/${proposalId}/messages`);
  },

  sendMessage: async (proposalId, content) => {
    const trimmed = (content || '').trim();
    if (!trimmed) {
      const err = new Error('Message cannot be empty.');
      err.status = 400;
      throw err;
    }
    return await api.post(`/api/proposals/${proposalId}/messages`, { content: trimmed });
  },
};
