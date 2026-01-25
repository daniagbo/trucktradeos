'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from './types';
import { mockUsers } from './mock-data';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'passwordHash' | 'role'> & {password: string}) => Promise<boolean>;
  updateProfile: (updatedData: Partial<User>) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  updateProfile: async () => false
});

const USERS_STORAGE_KEY = 'b2b_marketplace_users';
const SESSION_STORAGE_KEY = 'b2b_marketplace_session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Initialize users from mock data if not in localStorage
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!storedUsers) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mockUsers));
      setUsers(mockUsers);
    } else {
      setUsers(JSON.parse(storedUsers));
    }

    // Check for active session
    const sessionUserId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionUserId) {
      const allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const sessionUser = allUsers.find((u: User) => u.id === sessionUserId);
      if (sessionUser) {
        setUser(sessionUser);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    // In a real app, you'd call an API. Here we check our mock users.
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // We don't check password for this mock setup
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(SESSION_STORAGE_KEY, foundUser.id);
      toast({ title: 'Login Successful', description: `Welcome back, ${foundUser.name}!` });
      return true;
    } else {
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or password.' });
      return false;
    }
  }, [users, toast]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/');
  }, [router, toast]);

  const register = async (userData: Omit<User, 'id' | 'createdAt' | 'passwordHash' | 'role'> & {password: string}): Promise<boolean> => {
    const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
        toast({ variant: 'destructive', title: 'Registration Failed', description: 'An account with this email already exists.' });
        return false;
    }

    const newUser: User = {
        ...userData,
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        passwordHash: 'hashedpassword', // Mock hash
        role: 'member'
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    // Automatically log in the new user
    setUser(newUser);
    localStorage.setItem(SESSION_STORAGE_KEY, newUser.id);
    
    toast({ title: 'Registration Successful', description: `Welcome, ${newUser.name}!` });
    return true;
  };
  
  const updateProfile = useCallback(async (updatedData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);

    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    toast({ title: 'Profile Updated', description: 'Your information has been saved.' });
    return true;
  }, [user, users, toast]);

  const value = { user, loading, login, logout, register, updateProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
