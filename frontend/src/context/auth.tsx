import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Role, User } from "../api/types";
import { api } from "../api/client";

export interface Session {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Session>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: Role
  ) => Promise<Session>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = localStorage.getItem("quizzy.session");
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persist = useCallback((next: Session | null) => {
    setSession(next);
    if (next) {
      localStorage.setItem("quizzy.session", JSON.stringify(next));
      localStorage.setItem("quizzy.accessToken", next.accessToken);
    } else {
      localStorage.removeItem("quizzy.session");
      localStorage.removeItem("quizzy.accessToken");
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    api
      .get<{ success: boolean; data: User }>("/api/me")
      .then(({ data }) => persist({ ...session, user: data }))
      .catch(() => persist(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{
        success: boolean;
        data: { user: User; accessToken: string; refreshToken: string };
      }>("/api/auth/login", { email, password });
      const next: Session = {
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      };
      persist(next);
      return next;
    },
    [persist]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, role?: Role) => {
      const res = await api.post<{
        success: boolean;
        data: { user: User; accessToken: string; refreshToken: string };
      }>("/api/auth/register", { name, email, password, role });
      const next: Session = {
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      };
      persist(next);
      return next;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    if (session) {
      await api
        .post("/api/auth/logout", { refreshToken: session.refreshToken })
        .catch(() => undefined);
    }
    persist(null);
  }, [persist, session]);

  const refreshProfile = useCallback(async () => {
    const { data } = await api.get<{ success: boolean; data: User }>("/api/me");
    if (session) persist({ ...session, user: data });
  }, [persist, session]);

  const value = useMemo(
    () => ({ session, loading, login, register, logout, refreshProfile }),
    [session, loading, login, register, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
