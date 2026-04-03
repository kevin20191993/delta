const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function getToken(): string | null {
  return localStorage.getItem('kp-cotizador-token');
}

export function saveToken(token: string): void {
  localStorage.setItem('kp-cotizador-token', token);
}

export function clearToken(): void {
  localStorage.removeItem('kp-cotizador-token');
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export interface QuotationResponse {
  quotation: {
    id: string;
    folio: string;
    status: string;
    [key: string]: any;
  };
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface CustomerRecord {
  id: string;
  name: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  rfc?: string;
  address?: string;
  logoDataUrl?: string;
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();
  const requiresAuth = options.requiresAuth ?? true;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-company-id': 'default',
      ...(requiresAuth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (requiresAuth && response.status === 401) {
    clearToken();
    window.location.href = '/cotizador/login';
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    const detailMessage = Array.isArray(error.details) && error.details.length
      ? error.details.map((detail: any) => `${detail.path?.join?.('.') || 'campo'}: ${detail.message}`).join(', ')
      : '';
    throw new Error(detailMessage ? `${error.error}: ${detailMessage}` : (error.error || `HTTP ${response.status}`));
  }

  return response.json();
}

export class ApiClient {
  static login(username: string, password: string): Promise<{ token: string; user: string; email: string; role: string }> {
    return request('/api/auth/login', {
      method: 'POST',
      requiresAuth: false,
      body: JSON.stringify({ username, password })
    });
  }

  static requestPasswordReset(email: string): Promise<{ message: string; resetUrl?: string }> {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      requiresAuth: false,
      body: JSON.stringify({ email })
    });
  }

  static validateResetToken(token: string): Promise<{ email: string; expiresAt: string }> {
    return request(`/api/auth/reset-password/${encodeURIComponent(token)}`, {
      method: 'GET',
      requiresAuth: false
    });
  }

  static resetPassword(token: string, password: string, confirmPassword: string): Promise<{ message: string }> {
    return request('/api/auth/reset-password', {
      method: 'POST',
      requiresAuth: false,
      body: JSON.stringify({ token, password, confirmPassword })
    });
  }

  static fetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return request(endpoint, options);
  }

  static getCompany() {
    return this.fetch('/api/company', { method: 'GET' });
  }

  static updateCompany(data: any) {
    return this.fetch('/api/company', { method: 'PUT', body: JSON.stringify(data) });
  }

  static createQuotation(data: any): Promise<QuotationResponse> {
    return this.fetch('/api/quotations', { method: 'POST', body: JSON.stringify(data) });
  }

  static updateQuotation(id: string, data: any): Promise<QuotationResponse> {
    return this.fetch(`/api/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  static getQuotation(id: string) {
    return this.fetch(`/api/quotations/${id}`, { method: 'GET' });
  }

  static getQuotationByFolio(folio: string) {
    return this.fetch(`/api/quotations/folio/${folio}`, { method: 'GET' });
  }

  static getNextFolio(): Promise<{ folio: string }> {
    return this.fetch('/api/quotations/next-folio', { method: 'GET' });
  }

  static listQuotations(filters?: { status?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const query = params.toString();
    return this.fetch(`/api/quotations${query ? `?${query}` : ''}`, { method: 'GET' });
  }

  static updateQuotationStatus(id: string, status: string, note?: string) {
    return this.fetch(`/api/quotations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    });
  }

  static duplicateQuotation(id: string, folio: string) {
    return this.fetch(`/api/quotations/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ folio })
    });
  }

  static deleteQuotation(id: string) {
    return this.fetch(`/api/quotations/${id}`, { method: 'DELETE' });
  }

  static exportPdf(id: string) {
    return this.fetch(`/api/quotations/${id}/export-pdf`, { method: 'POST' });
  }

  static listCustomers(limit = 100): Promise<{ customers: CustomerRecord[] }> {
    return this.fetch(`/api/customers?limit=${limit}`, { method: 'GET' });
  }

  static listUsers(): Promise<{ users: UserSummary[] }> {
    return this.fetch('/api/users', { method: 'GET' });
  }

  static createUser(data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: string;
  }): Promise<{ user: UserSummary }> {
    return this.fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
