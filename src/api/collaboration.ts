import { api } from './axiosConfig';
import { CollaborationInvite, Collaborator } from '../types';

export const inviteCollaborator = async (
  sessionId: string,
  collaboratorId: string,
  role: 'editor' | 'viewer' = 'viewer',
): Promise<{ message: string }> => {
  const response = await api.post('/api/collaboration/invite', {
    sessionId,
    collaboratorId,
    role,
  });
  return response.data;
};

export const getCollaborators = async (
  sessionId: string,
): Promise<Collaborator[]> => {
  const response = await api.get(`/api/collaboration/session/${sessionId}`);
  return response.data;
};

export const respondToInvite = async (
  sessionId: string,
  status: 'accepted' | 'rejected',
): Promise<{ message: string }> => {
  const response = await api.patch(`/api/collaboration/invite/${sessionId}`, {
    status,
  });
  return response.data;
};

export const removeCollaborator = async (
  sessionId: string,
  collaboratorId: string,
): Promise<void> => {
  await api.delete(
    `/api/collaboration/session/${sessionId}/collaborator/${collaboratorId}`,
  );
};

export const getSharedWithMe = async (): Promise<any[]> => {
  const response = await api.get('/api/collaboration/shared');
  return response.data;
};

export const getPendingInvites = async (): Promise<CollaborationInvite[]> => {
  const response = await api.get('/api/collaboration/invites');
  return response.data;
};
