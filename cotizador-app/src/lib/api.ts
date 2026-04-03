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
    // Decode JWT payload (no verification, just expiry check)
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

export class ApiClient {
  static async fetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const token = getToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-company-id': 'default',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });

    if (response.status === 401) {
      clearToken();
      window.location.href = '/cotizador/login';
      throw new Error('Sesión expirada');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static async login(username: string, password: string): Promise<{ token: string; user: string }> {
    const url = `${API_BASE}/api/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error de red' }));
      throw new Error(error.error || 'Credenciales incorrectas');
    }
    return response.json();
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

  static getQuotation(id: string) {
    return this.fetch(`/api/quotations/${id}`, { method: 'GET' });
  }

  static getQuotationByFolio(folio: string) {
    return this.fetch(`/api/quotations/folio/${folio}`, { method: 'GET' });
  }

  static listQuotations(filters?: { status?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const query = params.toString();
    return this.fetch(`/api/quotations${query ? '?' + query : ''}`, { method: 'GET' });
  }

  static updateQuotationStatus(id: string, status: string, note?: string) {
    return this.fetch(`/api/quotations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note })
    });
  }

  static duplicateQuotation(id: string, folio: string) {
    return this.fetch(`/api/quotations/${id}/duplicate`, { method: 'POST', body: JSON.stringify({ folio }) });
  }

  static deleteQuotation(id: string) {
    return this.fetch(`/api/quotations/${id}`, { method: 'DELETE' });
  }

  static exportPdf(id: string) {
    return this.fetch(`/api/quotations/${id}/export-pdf`, { method: 'POST' });
  }
}

