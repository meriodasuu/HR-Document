const TOKEN_KEY = "hr_auth_token";
const USER_KEY = "hr_auth_user";
const ROLE_KEY = "hr_auth_role";

export type UserRole = "hr" | "director";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function getRole(): UserRole {
  return (localStorage.getItem(ROLE_KEY) as UserRole | null) ?? "hr";
}

export function setAuth(token: string, username: string, role: UserRole): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(`/api${path}`, { ...options, headers });
  if (response.status === 401) {
    clearAuth();
    window.dispatchEvent(new Event("hr-logout"));
  }
  return response;
}

export async function validateCurrentSession(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  const response = await fetch("/api/auth/me", {
    headers: { "Authorization": `Bearer ${token}` },
  }).catch(() => null);

  if (!response?.ok) {
    clearAuth();
    return false;
  }

  const data = await response.json().catch(() => null);
  if (data?.username && data?.role) {
    setAuth(token, data.username, data.role);
  }

  return true;
}

export async function login(username: string, password: string): Promise<{ token: string; username: string; role: UserRole }> {
  const resp = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error ?? "Ошибка входа");
  }
  const data = await resp.json();
  setAuth(data.token, data.username, data.role ?? "hr");
  return data;
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
    }).catch(() => {});
  }
  clearAuth();
}
