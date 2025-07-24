import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { User, RegisterInput } from '../services/api';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await ApiService.login({ email, password });
      const { token, user: loggedInUser } = res.data;

      if (!token?.access || !loggedInUser) return false;

      localStorage.setItem('authToken', token.access);
      localStorage.setItem('refreshToken', token.refresh);
      localStorage.setItem('userRole', loggedInUser.role || 'patient');
      localStorage.setItem('user', JSON.stringify(loggedInUser));

      setUser(loggedInUser);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (userData: RegisterInput): Promise<boolean> => {
    try {
      const res = await ApiService.register(userData);
      const { token, user: newUser } = res.data;

      if (!token?.access || !newUser) return false;

      localStorage.setItem('authToken', token.access);
      localStorage.setItem('refreshToken', token.refresh);
      localStorage.setItem('userRole', newUser.role || userData.role);
      localStorage.setItem('user', JSON.stringify(newUser));

      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = async () => {
    await ApiService.logout();
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
  };

  return { user, setUser, login, register, logout };
};
