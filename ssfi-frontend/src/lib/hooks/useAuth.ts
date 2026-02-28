'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api/client'; // Assuming api export exists in client.ts
import { UserRole } from '@/types/dashboard';

interface User {
    id: string;
    uid: string;
    role: UserRole;
    email?: string;
    phone: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    profile_photo?: string;
    // Add other fields as needed
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    const verifyAuth = useCallback(async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');

            if (!accessToken) {
                setIsAuthenticated(false);
                setUser(null);
                setToken(null);
                setIsLoading(false);
                return;
            }

            setToken(accessToken);

            // Check if we have user data in localStorage
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error('Auth verification failed', error);
            setIsAuthenticated(false);
            setUser(null);
            setToken(null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        verifyAuth();
    }, [verifyAuth]);

    const login = async (accessToken: string, userData: User) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
        toast.success('Logged in successfully');
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        toast.success('Logged out successfully');
        router.push('/auth/login');
    };

    return {
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshAuth: verifyAuth
    };
};
