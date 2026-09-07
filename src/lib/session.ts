import { Store, useStore } from "@tanstack/react-store";
import { api } from "./api";
import { staff } from "./data";
import { store } from "./store";
import type { Role, StaffUser } from "./types";

const KEY = "hotelogx.session.v1";
const USER_KEY = "hotelogx.user.v1";

interface SessionState {
  userId: string | null;
  user: StaffUser | null;
  ready: boolean;
}

export const sessionStore = new Store<SessionState>({ userId: null, user: null, ready: false });

export async function hydrateSession() {
  if (typeof window === "undefined") return;
  const storedId = window.localStorage.getItem(KEY);
  let cachedUser: StaffUser | null = null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (raw) cachedUser = JSON.parse(raw);
  } catch {}

  const demoUser = storedId ? staff.find((u) => u.id === storedId) : undefined;
  const initialUser = cachedUser || demoUser || null;

  let token = window.localStorage.getItem("token");
  if (!token && demoUser) {
    try {
      const res = await api.login({ email: demoUser.email, userId: demoUser.id });
      if (res?.token) {
        window.localStorage.setItem("token", res.token);
        token = res.token;
      }
    } catch {}
  }

  if (token) {
    try {
      const meRes = await api.getMe();
      if (meRes?.user) {
        const freshUser: StaffUser = {
          id: meRes.user.id,
          name: meRes.user.name,
          email: meRes.user.email,
          role: meRes.user.role as Role,
          title: meRes.user.title || "Staff",
          phone: meRes.user.phone || "",
          initials: meRes.user.initials || "ST",
          lastActive: "now",
          whatsapp: Boolean(meRes.user.whatsapp),
        };
        window.localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        sessionStore.setState(() => ({ userId: freshUser.id, user: freshUser, ready: true }));
        const { initBackendSync } = await import("./store");
        initBackendSync();
        return;
      }
    } catch {}
  }

  sessionStore.setState(() => ({ userId: storedId ?? initialUser?.id ?? null, user: initialUser, ready: true }));
}

export async function signIn(userId: string, customUser?: StaffUser) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, userId);
    if (customUser) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(customUser));
    }
  }

  const demoFound = staff.find((u) => u.id === userId);
  if (demoFound && !customUser) {
    try {
      const res = await api.login({ email: demoFound.email, userId: demoFound.id });
      if (res?.token && typeof window !== "undefined") {
        window.localStorage.setItem("token", res.token);
      }
    } catch (e) {
      console.warn("Backend auth token sync skipped:", e);
    }
  }

  sessionStore.setState(() => ({ userId, user: customUser || demoFound || null, ready: true }));

  try {
    const { initBackendSync } = await import("./store");
    initBackendSync();
  } catch {}
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem("token");
  }
  sessionStore.setState(() => ({ userId: null, user: null, ready: true }));
}

export function useSession() {
  return useStore(sessionStore, (s) => s);
}

export function useCurrentUser(): StaffUser | null {
  const { userId, user } = useStore(sessionStore, (s) => s);
  if (!userId) return null;
  const storeUser = store.state.users.find((u) => u.id === userId || u.email === userId);
  return storeUser ?? user ?? staff.find((u) => u.id === userId) ?? null;
}

export const roleHome: Record<Role, string> = {
  manager: "/manager",
  "front-office": "/front-office",
  housekeeping: "/housekeeping",
  maintenance: "/maintenance",
};

export const roleLabel: Record<Role, string> = {
  manager: "Hotel Manager",
  "front-office": "Front Office",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance / Technical",
};
