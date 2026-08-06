/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, tokenStorage, userStorage } from '../api/client';
import type { Role, User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  busy: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (u: User) => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => userStorage.get());
  const [token, setToken] = useState<string | null>(() => tokenStorage.get());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onUnauthorized = () => {
      tokenStorage.clear();
      userStorage.clear();
      setToken(null);
      setUser(null);
    };
    window.addEventListener('le-unauthorized', onUnauthorized);
    return () => window.removeEventListener('le-unauthorized', onUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    setBusy(true);
    try {
      const res = await api.login(email, password);
      tokenStorage.set(res.token);
      setToken(res.token);
      const profile = await api.getUser(res.userId);
      userStorage.set(profile);
      setUser(profile);
    } catch (err) {
      tokenStorage.clear();
      userStorage.clear();
      setToken(null);
      setUser(null);
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    tokenStorage.clear();
    userStorage.clear();
    setToken(null);
    setUser(null);
  };

  const updateUser = (u: User) => {
    userStorage.set(u);
    setUser(u);
  };

  const hasRole = (...roles: Role[]) => (user ? roles.includes(user.role) : false);

  return (
    <AuthContext.Provider value={{ user, token, busy, login, logout, updateUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
