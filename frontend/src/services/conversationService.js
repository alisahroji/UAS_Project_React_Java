import { api } from './api';
import { jobService } from './jobService';
import { proposalService } from './proposalService';

/**
 * Conversation discovery for the Messages inbox (Step 9).
 *
 * The backend has NO global "conversation list" endpoint, so this service assembles
 * real conversations exclusively from EXISTING endpoints (no fake data, no backend changes):
 *
 * - FREELANCER: GET /api/proposals/me -> own proposals (every proposal is a chat context).
 * - CLIENT: GET /api/jobs (JobDto includes clientId) -> own jobs -> GET /api/jobs/{id}/proposals
 *   (owner-only endpoint) -> proposals on own jobs. Jobs without proposals contribute nothing.
 *
 * Deduplicated by proposal id, sorted by most recent activity. Each entry carries the
 * proposal id used by the existing ChatPage route (/chat/:proposalId) and the STOMP topic.
 */
export const conversationService = {
  getConversations: async () => {
    const me = await api.get('/api/auth/me');
    const isFreelancer = me.role === 'FREELANCER';

    let raw = [];
    if (isFreelancer) {
      raw = (await proposalService.getMyProposals()) || [];
    } else {
      const jobs = (await jobService.getJobs()) || [];
      const myJobs = jobs.filter((j) => j.clientId && j.clientId === me.id);
      const perJob = await Promise.all(
        myJobs.map(async (job) => {
          try {
            return await proposalService.getProposals(job.id);
          } catch {
            // Owner-only endpoint; a non-owner or transient failure contributes no conversations
            return [];
          }
        })
      );
      raw = perJob.flat();
    }

    // Deduplicate by proposal id and map to conversation shape
    const byId = new Map();
    for (const p of raw) {
      if (!p?.id || byId.has(p.id)) continue;
      byId.set(p.id, {
        proposalId: p.id,
        jobId: p.jobId,
        jobTitle: p.jobTitle || 'Untitled job',
        status: p.status,
        counterpartyName: isFreelancer ? 'Client' : (p.freelancerName || 'Freelancer'),
        counterpartyId: isFreelancer ? null : p.freelancerId,
        isFreelancer,
        lastActivity: p.updatedAt || p.createdAt || null,
      });
    }

    return [...byId.values()].sort((a, b) => {
      const ta = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
      const tb = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
      return tb - ta;
    });
  },
};
