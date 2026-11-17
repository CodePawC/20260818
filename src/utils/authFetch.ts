import type { AuthUser } from '../types';

const AUTH_STORAGE_KEY = 'hospital_medtech_current_user';

let activeMemoryUser: AuthUser | null = null;
let fetchPatched = false;

export function setAuthFetchUser(user: AuthUser | null): void {
  activeMemoryUser = user;
}

function getCurrentAuthHeaders(): Record<string, string> {
  let user: Partial<AuthUser> | null = activeMemoryUser;
  if (!user && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        user = JSON.parse(raw);
      }
    } catch {
      user = null;
    }
  }
  if (!user) return {};

  const headers: Record<string, string> = {};
  if (user.id) headers['x-user-id'] = encodeURIComponent(String(user.id));
  if (user.employeeNo) headers['x-user-emp-no'] = encodeURIComponent(String(user.employeeNo));
  if (user.name) headers['x-user-name'] = encodeURIComponent(String(user.name));
  if (user.role) headers['x-user-role'] = encodeURIComponent(String(user.role));
  if (user.departmentName) headers['x-user-dept'] = encodeURIComponent(String(user.departmentName));
  if (user.stakeholderCategory) headers['x-user-cluster'] = encodeURIComponent(String(user.stakeholderCategory));
  headers['x-user-is-admin'] = user.isAdmin ? 'true' : 'false';
  return headers;
}

/**
 * 全局增强 window.fetch：为同源 /api/* 请求自动注入当前登录身份头，
 * 并统一拦截 403 权限不足响应派发通知事件。
 */
export function initAuthFetchInterceptor(): void {
  if (fetchPatched || typeof window === 'undefined' || typeof window.fetch !== 'function') {
    return;
  }

  const rawFetch = window.fetch;
  const originalFetch = rawFetch.bind(window);

  const wrappedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const isApiCall =
      urlStr.startsWith('/api/') ||
      (typeof window !== 'undefined' && urlStr.startsWith(`${window.location.origin}/api/`));

    if (!isApiCall) {
      return originalFetch(input, init);
    }

    const authHeaders = getCurrentAuthHeaders();
    const mergedHeaders = new Headers(
      init?.headers || (typeof input !== 'string' && !(input instanceof URL) ? input.headers : undefined)
    );

    Object.entries(authHeaders).forEach(([key, val]) => {
      if (!mergedHeaders.has(key)) {
        mergedHeaders.set(key, val);
      }
    });

    const response = await originalFetch(input, {
      ...init,
      headers: mergedHeaders
    });

    if (response.status === 403) {
      try {
        const cloned = response.clone();
        const data = await cloned.json();
        const msg = data?.error || '权限不足：当前登录角色无权执行此操作';
        window.dispatchEvent(new CustomEvent('medtech:rbac-forbidden', { detail: { message: msg, url: urlStr } }));
      } catch {
        window.dispatchEvent(
          new CustomEvent('medtech:rbac-forbidden', {
            detail: { message: '权限不足：当前登录角色无权执行此操作', url: urlStr }
          })
        );
      }
    }

    return response;
  };

  try {
    const ownDesc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (ownDesc && !ownDesc.configurable) {
      if (ownDesc.writable) {
        (window as unknown as { fetch: typeof fetch }).fetch = wrappedFetch;
        fetchPatched = true;
      } else {
        console.warn('[authFetch] window.fetch is non-configurable and read-only; skipping global patch.');
      }
      return;
    }

    Object.defineProperty(window, 'fetch', {
      value: wrappedFetch,
      configurable: true,
      writable: true,
      enumerable: ownDesc?.enumerable ?? true
    });
    fetchPatched = true;
  } catch (err) {
    try {
      const proto = Object.getPrototypeOf(window);
      const protoDesc = proto ? Object.getOwnPropertyDescriptor(proto, 'fetch') : undefined;
      if (!protoDesc || protoDesc.writable || protoDesc.set) {
        (window as unknown as { fetch: typeof fetch }).fetch = wrappedFetch;
        fetchPatched = true;
        return;
      }
    } catch {
      // Ignore fallback error
    }
    console.warn('[authFetch] Failed to patch window.fetch cleanly:', err);
  }
}
