import { Sample, User, Company, DashboardStats, NotificationLog, Communication } from '../types/index.js';

const getAuthToken = (): string | null => {
  return localStorage.getItem('hdi_portal_token');
};

const authHeaders = (isJson = true) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const getTargetUrl = (input: RequestInfo | URL): RequestInfo | URL => {
  if (typeof input === 'string' && input.startsWith('/')) {
    return API_BASE ? `${API_BASE}${input}` : input;
  }
  return input;
};

// Resilient fetch that retries during dev startup if backend is still initializing
const httpFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 2,
  delayMs = 500
): Promise<Response> => {
  try {
    const res = await fetch(getTargetUrl(input), init);
    // If backend returned 503 during boot or reconnect, wait and retry smoothly
    if (res.status === 503 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return httpFetch(input, init, retries - 1, delayMs);
    }
    return res;
  } catch (err: any) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return httpFetch(input, init, retries - 1, delayMs);
    }
    throw err;
  }
};

const safeJson = async (res: Response, fallbackError = 'Request failed') => {
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    data = { message: res.ok ? 'Success' : `${fallbackError} (${res.status} ${res.statusText || 'Server Error'})` };
  }
  if (!res.ok) {
    throw new Error(data.message || data.error || fallbackError);
  }
  return data;
};

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await httpFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return safeJson(res, 'Login failed');
  },

  async resetPassword(identifier: string, newPassword: string) {
    const res = await httpFetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, newPassword }),
    });
    return safeJson(res, 'Password reset failed');
  },

  async switchLab(labIdentifier: string) {
    const res = await httpFetch('/api/auth/switch-lab', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ labIdentifier }),
    });
    return safeJson(res, 'Lab switch failed');
  },

  async revertToSuperAdmin() {
    const res = await httpFetch('/api/auth/revert-superadmin', {
      method: 'POST',
      headers: authHeaders(),
    });
    return safeJson(res, 'Failed to restore Super Admin session');
  },

  async getCurrentUser(): Promise<User> {
    const res = await httpFetch('/api/auth/me', {
      headers: authHeaders(),
    });
    const data = await safeJson(res, 'Failed to fetch user');
    return data.user;
  },

  async getUsers(): Promise<User[]> {
    const res = await httpFetch('/api/auth/users', {
      headers: authHeaders(),
    });
    const data = await safeJson(res, 'Failed to fetch users');
    return data.users || [];
  },

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
    labIdentifier?: string;
    labName?: string;
  }): Promise<User> {
    const res = await httpFetch('/api/auth/users', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await safeJson(res, 'Failed to create user');
    return data.user;
  },

  // Samples
  async getPreviewCode(dateOfEntry: string, sampleNature: string): Promise<string> {
    const params = new URLSearchParams({ dateOfEntry, sampleNature });
    const res = await httpFetch(`/api/samples/preview-code?${params.toString()}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.sampleCode;
  },

  async getSamples(filters: Record<string, any> = {}): Promise<Sample[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params.append(k, String(v));
      }
    });
    const res = await httpFetch(`/api/samples?${params.toString()}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.samples || [];
  },

  async getSampleById(id: string): Promise<Sample> {
    const res = await httpFetch(`/api/samples/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch sample');
    return data.sample;
  },

  async createSample(sampleData: Partial<Sample>): Promise<Sample> {
    const res = await httpFetch('/api/samples', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(sampleData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create sample');
    return data.sample;
  },

  async updateSample(id: string, updateData: Record<string, any>): Promise<Sample> {
    const res = await httpFetch(`/api/samples/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update sample');
    return data.sample;
  },

  async addComment(id: string, message: string, attachmentUrl?: string): Promise<any> {
    const res = await httpFetch(`/api/samples/${id}/comments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message, attachmentUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to post comment');
    return data.comments;
  },

  async sendOneWeekTatNotice(id: string): Promise<Sample> {
    const res = await httpFetch(`/api/samples/${id}/notify-tat-week`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send 1-week TAT notice');
    return data.sample;
  },

  async notifyCannotTest(id: string, reason: string): Promise<Sample> {
    const res = await httpFetch(`/api/samples/${id}/cannot-test`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to report inability to test');
    return data.sample;
  },

  async reportResultDiscrepancy(id: string, note: string, attachmentUrl?: string): Promise<Sample> {
    const res = await httpFetch(`/api/samples/${id}/report-discrepancy`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ note, attachmentUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to report result discrepancy');
    return data.sample;
  },

  // Deleted Bin (Super Admin only)
  async getDeletedSamples(): Promise<Sample[]> {
    const res = await httpFetch('/api/samples/deleted-bin', {
      headers: authHeaders(),
    });
    const data = await safeJson(res, 'Failed to fetch deleted samples');
    return data.samples || [];
  },

  async deleteSample(id: string, reason?: string): Promise<{ message: string; sample: Sample }> {
    const res = await httpFetch(`/api/samples/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    return safeJson(res, 'Failed to delete sample');
  },

  async restoreSample(id: string): Promise<{ message: string; sample: Sample }> {
    const res = await httpFetch(`/api/samples/${id}/restore`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return safeJson(res, 'Failed to restore sample');
  },

  async permanentlyDeleteSample(id: string): Promise<{ message: string }> {
    const res = await httpFetch(`/api/samples/${id}/permanent`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return safeJson(res, 'Failed to permanently delete sample');
  },

  // Bulk Import Historical / Previous Samples
  async bulkImportSamples(samples: Partial<Sample>[], suppressNotifications: boolean = true): Promise<{ message: string; count: number; samples: Sample[]; errors?: string[] }> {
    const res = await httpFetch('/api/samples/bulk-import', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ samples, suppressNotifications }),
    });
    return safeJson(res, 'Failed to import previous samples');
  },

  // Live Test Email Verification
  async sendTestEmail(toEmail?: string): Promise<{ success: boolean; message: string }> {
    const res = await httpFetch('/api/notifications/test-email', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ toEmail }),
    });
    return safeJson(res, 'Failed to dispatch test notification');
  },

  // Companies
  async getCompanies(): Promise<Company[]> {
    const res = await httpFetch('/api/companies', {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.companies || [];
  },

  async createCompany(name: string, contactPerson?: string, email?: string, phone?: string, address?: string): Promise<Company> {
    const res = await httpFetch('/api/companies', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, contactPerson, email, phone, address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add company');
    return data.company;
  },

  // Reports & Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await httpFetch('/api/reports/dashboard-stats', {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data;
  },

  async getNotificationsFeed(): Promise<NotificationLog[]> {
    const res = await httpFetch('/api/notifications', {
      headers: authHeaders(),
    });
    const data = await res.json();
    return data.logs || [];
  },

  // Communications / Tickets / Chats (Admin <-> Lab)
  async getCommunications(labIdentifier?: string): Promise<Communication[]> {
    const query = labIdentifier && labIdentifier !== 'ALL' ? `?labIdentifier=${encodeURIComponent(labIdentifier)}` : '';
    const res = await httpFetch(`/api/communications${query}`, {
      headers: authHeaders(),
    });
    const data = await safeJson(res, 'Failed to fetch communications');
    return data.communications || [];
  },

  async createCommunication(payload: {
    message: string;
    subject?: string;
    sampleCode?: string;
    priority?: 'NORMAL' | 'URGENT' | 'HIGH';
    labIdentifier?: string;
  }): Promise<Communication> {
    const res = await httpFetch('/api/communications', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await safeJson(res, 'Failed to send message');
    return data.communication;
  },

  async updateCommunicationStatus(id: string, status: 'OPEN' | 'RESOLVED'): Promise<Communication> {
    const res = await httpFetch(`/api/communications/${id}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await safeJson(res, 'Failed to update status');
    return data.communication;
  },

  // File Upload
  async uploadFile(file: File): Promise<{ fileUrl: string; originalName: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await httpFetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'File upload failed');
    return data;
  },
};

