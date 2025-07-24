// src/contexts/AuthContext.tsx

import React, { createContext, useContext } from 'react';
import { useAuthState } from '../hooks/useAuth';
import { User,RegisterInput } from '../services/api'; // ✅ Match your actual type export

// Define the context type
interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterInput) => Promise<boolean>;  // ✅ FIXED
  logout: () => Promise<void>;
}


// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to consume the context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser, login, register, logout: logoutFromHook } = useAuthState();

  const logout = async () => {
    try {
      await logoutFromHook(); // Clears token and localStorage
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
