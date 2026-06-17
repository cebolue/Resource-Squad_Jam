const API_BASE = import.meta.env.VITE_API_BASE || '';

const request = async (path) => {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.error || error.message || 'API error');
  }
  return response.json();
};

export const fetchTeams = () => request('/api/teams');
export const fetchTeamDashboard = (teamId, iterationPath) => {
  const query = iterationPath ? `?iterationPath=${encodeURIComponent(iterationPath)}` : '';
  return request(`/api/teams/${teamId}/dashboard${query}`);
};
