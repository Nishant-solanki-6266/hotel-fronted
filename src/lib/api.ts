const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      console.warn(`API request to ${endpoint} returned status ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    console.warn(`API request to ${endpoint} failed (backend might be offline, using local store):`, err);
    return null;
  }
}

export const api = {
  // Rooms
  getRooms: () => request<any[]>('/rooms'),
  updateRoomStatus: (number: string, status: string, cleaner?: string, note?: string) =>
    request(`/rooms/${number}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, cleaner, note }),
    }),

  // Tasks
  getTasks: () => request<any[]>('/tasks'),
  createTask: (data: any) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTaskStatus: (id: string, status: string, note?: string, via?: string) =>
    request(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, via }),
    }),

  // Issues / Maintenance
  getIssues: () => request<any[]>('/issues'),
  createIssue: (data: any) =>
    request('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIssueStatus: (id: string, status: string, note?: string, via?: string) =>
    request(`/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note, via }),
    }),

  // Conversations / Chat
  getConversations: () => request<any[]>('/conversations'),
  sendReply: (id: string, body: string, staffName?: string, channel?: string) =>
    request(`/conversations/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body, staffName, channel }),
    }),
  toggleTakeover: (id: string, aiStatus?: string) =>
    request(`/conversations/${id}/takeover`, {
      method: 'POST',
      body: JSON.stringify({ aiStatus }),
    }),

  // Upsells
  getUpsells: () => request<any[]>('/upsells'),
  updateUpsellStatus: (id: string, status: string) =>
    request(`/upsells/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // WhatsApp Simulator
  getWaThreads: () => request<any[]>('/whatsapp/threads'),
  sendWaAction: (data: any) =>
    request('/whatsapp/action', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Manager & Health
  getBriefing: () => request<any>('/manager/briefing'),
  getActivity: () => request<any[]>('/manager/activity'),
  getAiRules: () => request<any[]>('/manager/rules'),
  getKnowledge: () => request<any[]>('/manager/knowledge'),
  getHealth: () => request<any>('/health'),

  // PMS Integration
  connectPms: (provider: string, propertyId: string) =>
    request<any>('/pms/connect', {
      method: 'POST',
      body: JSON.stringify({ provider, propertyId }),
    }),
  getPmsStatus: () => request<any>('/pms/status'),
  syncPms: () => request<any>('/pms/sync', { method: 'POST' }),

  // Guests & Reservations
  getGuests: () => request<any[]>('/guests'),
  getGuestById: (id: string) => request<any>(`/guests/${id}`),
  getReservations: () => request<any[]>('/reservations'),
  getReservationByNumber: (number: string) => request<any>(`/reservations/${number}`),

  // Server-side Onboarding State
  getOnboardingStatus: () => request<any>('/onboarding/status'),
  updateOnboardingStatus: (data: any) =>
    request<any>('/onboarding/status', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
