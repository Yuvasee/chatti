import React, { createContext, useState, useContext, ReactNode } from 'react';

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
  const [isLoading, setIsLoading] = useState(false);

  const login = async (name: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Mock API call - will be replaced with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate random user data
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: name || `Guest${Math.floor(Math.random() * 1000)}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
        language: 'en',
      };
      
      setUser(newUser);
      // Would save to localStorage or cookies in a real app
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    // Would clear localStorage or cookies in a real app
  };

  const setUserLanguage = (language: string): void => {
    if (user) {
      setUser({ ...user, language });
      // Would update in backend in a real app
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