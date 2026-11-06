import { create } from 'zustand';
import type { User } from '../../types';
import { storage, type RegisterInput } from '../../services/storage';

interface AuthState {
  user: User | null;
  ready: boolean;
  init: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  init: async () => set({ user: await storage.getSessionUser(), ready: true }),
  register: async (input) => set({ user: await storage.register(input) }),
  login: async (email, password) => set({ user: await storage.login(email, password) }),
  logout: async () => {
    await storage.logout();
    set({ user: null });
  },
}));
