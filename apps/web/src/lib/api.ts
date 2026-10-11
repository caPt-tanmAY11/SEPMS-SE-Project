const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: {
    message: string;
    code: string;
    details?: any[];
  };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('sepms_auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    data: null as any,
    error: {
      message: `Failed to parse response (Status: ${response.status})`,
      code: 'PARSE_ERROR'
    }
  }));

  if (!response.ok || !data.success) {
    const error: any = new Error(data.error?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = data.error?.code || 'API_ERROR';
    error.details = data.error?.details;
    throw error;
  }

  return data.data;
}
