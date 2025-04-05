import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { AuthService } from '../api';

interface User {
  id: string;
  name: string;
  avatar: string;
  language: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string) => Promise<void>;
  logout: () => void;
  setUserLanguage: (language: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          const userData = AuthService.getUser();
          if (userData) {
            setUser({
              ...userData,
              language: 'en', // Default language
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear potentially corrupted auth state
        AuthService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (name: string): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await AuthService.login(name);
      setUser({
        id: result.id,
        name: result.name,
        avatar: result.avatar,
        language: 'en', // Default language
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    AuthService.logout();
    setUser(null);
  };

  const setUserLanguage = (language: string): void => {
    if (user) {
      setUser({ ...user, language });
      // Note: We're not persisting language to backend in this version
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    setUserLanguage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 