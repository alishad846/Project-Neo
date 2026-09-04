// Website auth client. Talks to the same NestJS backend + Postgres `sellers`
// table the extension uses, so an account created here is exactly the account
// the extension's login gate accepts — that shared table is the wall.
//
// Base URL is overridable at build time (VITE_API_URL) for deploys; locally the
// backend runs on :3000 (Docker Postgres is on :5433 behind it).
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const TOKEN_KEY = "neo_token";
const USER_KEY = "neo_user";

export interface AuthUser {
  id: string;
  fullName: string;
  shopName: string;
  email: string;
}

interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

function store(res: AuthResponse) {
  try {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
  } catch {
    // storage disabled (private mode) — session just won't persist
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* no-op */
  }
}

async function post(path: string, body: unknown): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the Neo server. Make sure the backend is running.");
  }
  if (!res.ok) {
    let message = `Something went wrong (${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data?.message === "string") message = data.message;
      else if (Array.isArray(data?.message)) message = data.message.join(", ");
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  return res.json();
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const res = await post("/auth/login", input);
  store(res);
  return res.user;
}

export async function signup(input: {
  fullName: string;
  shopName: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  // Backend signup returns the seller (no token); log in straight after so the
  // website session mirrors the extension's flow.
  await post("/auth/signup", input);
  return login({ email: input.email, password: input.password });
}
