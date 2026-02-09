'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from './types';
import { useToast } from '@/hooks/use-toast';
import { normalizeUser } from './normalizers';


interface AuthContextType {
  // ... unchanged interface
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; mustChangePassword?: boolean }>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'passwordHash' | 'role'> & { password: string }) => Promise<boolean>;
  updateProfile: (updatedData: Partial<User>) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: () => { },
  register: async () => false,
  updateProfile: async () => false
});

// Removed USERS_STORAGE_KEY as we now use backend persistence only

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Removed users array state
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Removed local storage init

    // Check for active session via API
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUser(normalizeUser(data.user));
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<{ success: boolean; mustChangePassword?: boolean }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }), // Sending raw password to mock API
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Login Failed', description: data.message || 'Invalid credentials' });
        return { success: false };
      }

      setUser(normalizeUser(data.user));
      toast({ title: 'Login Successful', description: `Welcome back, ${data.user.name}!` });
      return { success: true, mustChangePassword: Boolean(data.user.mustChangePassword) };

    } catch (error) {
      toast({ variant: 'destructive', title: 'Login Failed', description: 'An unexpected error occurred.' });
      return { success: false };
    }
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/');
      router.refresh(); // Refresh to clear server components cache
    } catch (error) {
      console.error('Logout failed', error);
    }
  }, [router, toast]);

  const register = async (userData: Omit<User, 'id' | 'createdAt' | 'passwordHash' | 'role'> & { password: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Registration Failed', description: data.message || 'Could not create account.' });
        return false;
      }

      setUser(normalizeUser(data.user));
      toast({ title: 'Registration Successful', description: `Welcome, ${data.user.name}!` });

      // No client-side storage for users anymore

      return true;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Registration Failed', description: 'An unexpected error occurred.' });
      return false;
    }
  };

  const updateProfile = useCallback(async (updatedData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Update Failed', description: data.message || 'Could not save profile.' });
        return false;
      }
      setUser(normalizeUser(data.user));
      toast({ title: 'Profile Updated', description: 'Your information has been saved.' });
      return true;
    } catch (error) {
      console.error('Failed to update profile', error);
      toast({ variant: 'destructive', title: 'Update Failed', description: 'Unexpected error while saving profile.' });
      return false;
    }
  }, [user, toast]);

  const value = { user, loading, login, logout, register, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
