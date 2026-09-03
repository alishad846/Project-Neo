const API_URL = "http://localhost:3000";

export interface AuthUser {
  id: number;
  fullName: string;
  shopName: string;
  email: string;
  [key: string]: unknown;
}

interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

const TOKEN_KEY = "neo_token";
const USER_KEY = "neo_user";

const chromeApi = (globalThis as { chrome?: any }).chrome;

function hasChromeStorage(): boolean {
  return Boolean(chromeApi?.storage?.local);
}

async function storageGet(key: string): Promise<string | null> {
  if (hasChromeStorage()) {
    const result = await chromeApi.storage.local.get(key);
    const value = result?.[key];
    return typeof value === "string" ? value : null;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  if (hasChromeStorage()) {
    await chromeApi.storage.local.set({ [key]: value });
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // no-op: storage unavailable
  }
}

async function storageRemove(key: string): Promise<void> {
  if (hasChromeStorage()) {
    await chromeApi.storage.local.remove(key);
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op: storage unavailable
  }
}

export async function getToken(): Promise<string | null> {
  return storageGet(TOKEN_KEY);
}

export async function setToken(t: string): Promise<void> {
  await storageSet(TOKEN_KEY, t);
}

export async function clearToken(): Promise<void> {
  await storageRemove(TOKEN_KEY);
  await storageRemove(USER_KEY);
}

export async function getUser(): Promise<AuthUser | null> {
  const raw = await storageGet(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

async function storeSession(res: AuthResponse): Promise<void> {
  await setToken(res.access_token);
  await storageSet(USER_KEY, JSON.stringify(res.user));
}

async function postAuth(path: string, body: unknown): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.message === "string") message = data.message;
      else if (Array.isArray(data?.message)) message = data.message.join(", ");
    } catch {
      // response wasn't JSON; fall back to generic message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const res = await postAuth("/auth/login", input);
  await storeSession(res);
  return res.user;
}

export async function signup(input: {
  fullName: string;
  shopName: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  await postAuth("/auth/signup", input);
  return login({ email: input.email, password: input.password });
}
