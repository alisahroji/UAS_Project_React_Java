import { api } from './api';

export const projectService = {
  getMyProjects: async () => {
    return await api.get('/api/projects');
  },

  getProjectById: async (projectId) => {
    return await api.get(`/api/projects/${projectId}`);
  },

  updateProjectStatus: async (projectId, status, message) => {
    const body = { status };
    if (message !== undefined && message !== null) body.message = message;
    return await api.post(`/api/projects/${projectId}/status`, body);
  },
};
