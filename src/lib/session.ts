import { Store, useStore } from "@tanstack/react-store";
import { api } from "./api";
import { staff } from "./data";
import { store } from "./store";
import type { Role, StaffUser } from "./types";

const KEY = "hotelogx.session.v1";

interface SessionState {
  userId: string | null;
  ready: boolean;
}

export const sessionStore = new Store<SessionState>({ userId: null, ready: false });

export async function hydrateSession() {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(KEY);
  const found = stored ? staff.find((u) => u.id === stored) : undefined;

  if (found) {
    let token = window.localStorage.getItem("token");
    if (!token) {
      try {
        const res = await api.login({ email: found.email, userId: found.id });
        if (res?.token) {
          window.localStorage.setItem("token", res.token);
          token = res.token;
        }
      } catch {}
    }

    if (token) {
      try {
        const { syncKnowledgeWithBackend } = await import("./store");
        syncKnowledgeWithBackend();
      } catch {}
    }
  }

  sessionStore.setState(() => ({ userId: found?.id ?? null, ready: true }));
}

export async function signIn(userId: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, userId);

  const found = staff.find((u) => u.id === userId);
  if (found) {
    try {
      const res = await api.login({ email: found.email, userId: found.id });
      if (res?.token && typeof window !== "undefined") {
        window.localStorage.setItem("token", res.token);
      }
    } catch (e) {
      console.warn("Backend auth token sync skipped:", e);
    }
  }

  sessionStore.setState(() => ({ userId, ready: true }));

  try {
    const { syncKnowledgeWithBackend } = await import("./store");
    syncKnowledgeWithBackend();
  } catch {}
}

export function signOut() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem("token");
  }
  sessionStore.setState(() => ({ userId: null, ready: true }));
}

export function useSession() {
  return useStore(sessionStore, (s) => s);
}

export function useCurrentUser(): StaffUser | null {
  const { userId } = useStore(sessionStore, (s) => s);
  if (!userId) return null;
  const storeUser = store.state.users.find((u) => u.id === userId);
  return storeUser ?? staff.find((u) => u.id === userId) ?? null;
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
