const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...((options.headers as Record<string, string>) || {}),
    };

    // If token is stored in localStorage or default dev token is needed
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

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

  // Auth
  login: (credentials: { email?: string; password?: string; userId?: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<any>('/auth/me'),

  // Conversations / Chat
  getConversations: () => request<any[]>('/conversations'),
  getConversationById: (id: string) => request<any>(`/conversations/${id}`),
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
  escalateConversation: (id: string, reason?: string, urgency?: string, suggested?: string) =>
    request(`/conversations/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason, urgency, suggested }),
    }),
  resolveConversation: (id: string) =>
    request(`/conversations/${id}/resolve`, {
      method: 'POST',
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
  getAiRules: () => request<any>('/manager/rules'),
  saveAiRules: (data: { aiMode?: string; rules?: Array<{ topic: string; mode: string; note?: string }> }) =>
    request<any>('/manager/rules', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getKnowledge: () => request<any[]>('/knowledge'),
  getKnowledgeDocs: () => request<any[]>('/knowledge'),
  uploadKnowledgeDoc: (file: File, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (category) {
      formData.append('category', category);
    }
    return request<any>('/knowledge', {
      method: 'POST',
      body: formData,
    });
  },
  deleteKnowledgeDoc: (id: string) =>
    request<any>(`/knowledge/${id}`, {
      method: 'DELETE',
    }),
  getHealth: () => request<any>('/health'),

  // Onboarding & Setup
  getOnboarding: () => request<any>('/onboarding/status'),
  getHotelProfile: () => request<any>('/onboarding/profile'),
  saveHotelProfile: (profileData: any) =>
    request('/onboarding/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    }),
  saveTopology: (topology: string) =>
    request('/onboarding/topology', {
      method: 'POST',
      body: JSON.stringify({ topology }),
    }),
  saveOnboardingStep: (stepKey: string, data?: any) =>
    request('/onboarding/step', {
      method: 'POST',
      body: JSON.stringify({ stepKey, data }),
    }),
  completeOnboarding: () =>
    request('/onboarding/complete', {
      method: 'POST',
    }),
  // Users & Staff
  getUsers: () => request<any[]>('/users'),
  inviteUser: (data: { email: string; role: string; name?: string; title?: string; phone?: string; whatsapp?: boolean }) =>
    request<any>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUserRole: (id: string, role: string) =>
    request<any>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  deleteUser: (id: string) =>
    request<any>(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Billing & Subscriptions
  getSubscription: () => request<any>('/billing/subscription'),
  updateSubscription: (data: { plan?: string; billingCycle?: string; rooms?: number }) =>
    request<any>('/billing/subscription', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getInvoices: () => request<any[]>('/billing/invoices'),
};

