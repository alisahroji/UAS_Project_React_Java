import { api } from './api';

export const jobService = {
  getJobs: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.direction) query.append('direction', params.direction);
    
    const queryString = query.toString();
    const endpoint = queryString ? `/api/jobs?${queryString}` : '/api/jobs';
    return await api.get(endpoint);
  },

  getJobById: async (id) => {
    return await api.get(`/api/jobs/${id}`);
  },

  createJob: async (jobData) => {
    return await api.post('/api/jobs', jobData);
  },

  updateJob: async (id, jobData) => {
    return await api.put(`/api/jobs/${id}`, jobData);
  },

  deleteJob: async (id) => {
    return await api.delete(`/api/jobs/${id}`);
  }
};
