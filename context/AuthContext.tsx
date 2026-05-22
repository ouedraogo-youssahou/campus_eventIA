import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS = [
  { email: 'admin@campus.ma', password: 'admin123', role: 'admin' as const },
  { email: 'etudiant@campus.ma', password: 'etudiant123', role: 'student' as const }
];

const STORAGE_KEY = '@auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true
  });

  useEffect(() => {
    loadStoredSession();
  }, []);

  async function loadStoredSession() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const user = JSON.parse(stored) as User;
        setState({ user, isLoading: false });
      } else {
        setState({ user: null, isLoading: false });
      }
    } catch (error) {
      setState({ user: null, isLoading: false });
    }
  }

  async function login(email: string, password: string): Promise<User | null> {
    const foundUser = USERS.find(
      u => u.email === email && u.password === password
    );

    if (foundUser) {
      const user: User = {
        email: foundUser.email,
        role: foundUser.role
      };
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      setState({ user, isLoading: false });
      return user;
    }

    return null;
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({ user: null, isLoading: false });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
