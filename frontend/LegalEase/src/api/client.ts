import type {
  AuditLog,
  CaseStatus,
  CreateCasePayload,
  Evidence,
  LegalCase,
  LoginResponse,
  RegisterPayload,
  User,
  VerificationStatus,
} from '../types';

function defaultHost(): string {
  const { hostname, protocol } = window.location;
  const host = hostname.includes(':') ? `[${hostname}]` : hostname;
  return `${protocol}//${host}:8080`;
}

const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? `${defaultHost()}/api/v1`;

const FILE_BASE: string = (import.meta.env.VITE_FILE_BASE as string | undefined) ?? defaultHost();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const tokenStorage = {
  get: (): string | null => localStorage.getItem('le_token'),
  set: (t: string) => localStorage.setItem('le_token', t),
  clear: () => localStorage.removeItem('le_token'),
};

export const userStorage = {
  get: (): User | null => {
    const raw = localStorage.getItem('le_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  set: (u: User) => localStorage.setItem('le_user', JSON.stringify(u)),
  clear: () => localStorage.removeItem('le_user'),
};

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  extraHeaders: Record<string, string> = {},
): Promise<T> {
  const { method = 'GET', body, formData } = options;
  const headers: Record<string, string> = { ...extraHeaders };
  const token = tokenStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!formData && body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as Record<string, unknown>;
      message = (data.message as string) ?? (data.error as string) ?? message;
    } catch {
      /* response was not JSON */
    }
    if (res.status === 401) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('le-unauthorized'));
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  register: (payload: RegisterPayload) =>
    request<User>('/auth/register', { method: 'POST', body: payload }),

  getUsers: () => request<User[]>('/users'),

  getUser: (id: string) => request<User>(`/users/${id}`),

  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  updateUserStatus: (id: string, active: boolean) =>
    request<User>(`/users/${id}/status`, { method: 'PATCH', body: { active } }),

  updateProfile: (id: string, payload: { name: string; email: string }) =>
    request<User>(`/users/${id}/profile`, { method: 'PATCH', body: payload }),

  changePassword: (id: string, payload: { currentPassword: string; newPassword: string }) =>
    request<void>(`/users/${id}/password`, { method: 'PUT', body: payload }),

  getCases: (params?: { officerId?: string; investigatorId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.officerId) qs.set('officerId', params.officerId);
    if (params?.investigatorId) qs.set('investigatorId', params.investigatorId);
    const query = qs.toString();
    return request<LegalCase[]>(`/cases${query ? `?${query}` : ''}`);
  },

  getCase: (id: string) => request<LegalCase>(`/cases/${id}`),

  createCase: (payload: CreateCasePayload, userId: string) =>
    request<LegalCase>('/cases', { method: 'POST', body: payload }, { 'X-User-Id': userId }),

  assignInvestigator: (caseId: string, investigatorId: string) =>
    request<LegalCase>(
      `/cases/${caseId}/assign`,
      { method: 'PUT', body: { investigatorId } },
    ),

  updateCaseStatus: (caseId: string, status: CaseStatus) =>
    request<LegalCase>(
      `/cases/${caseId}/status`,
      { method: 'PATCH', body: { status } },
    ),

  getEvidence: (caseId: string) => request<Evidence[]>(`/evidence/case/${caseId}`),

  uploadEvidence: (caseId: string, file: File, userId: string) => {
    const fd = new FormData();
    fd.append('caseId', caseId);
    fd.append('file', file);
    return request<Evidence>(
      '/evidence',
      { method: 'POST', formData: fd },
      { 'X-User-Id': userId },
    );
  },

  verifyEvidence: (evidenceId: string, status: VerificationStatus, remarks: string) =>
    request<Evidence>(
      `/evidence/${evidenceId}/verify`,
      { method: 'PATCH', body: { status, remarks } },
    ),

  getAuditLogs: () => request<AuditLog[]>('/audit'),

  getAuditLogsForCase: (caseId: string) => request<AuditLog[]>(`/audit/case/${caseId}`),
};

export async function downloadEvidence(id: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = tokenStorage.get();
  const user = userStorage.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (user) headers['X-User-Id'] = user.id;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/evidence/${id}/download`, { headers });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0);
  }

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as Record<string, unknown>;
      message = (data.message as string) ?? (data.error as string) ?? message;
    } catch {
      /* response was not JSON */
    }
    if (res.status === 401) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('le-unauthorized'));
    }
    throw new ApiError(message, res.status);
  }

  return res.blob();
}

export { FILE_BASE };
