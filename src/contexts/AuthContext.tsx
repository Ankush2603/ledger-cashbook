import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  lastLogin?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { email: string; password: string; name: string }) => Promise<void>;
  logout: () => void;
  syncWithBackend: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await apiService.verifyToken();
          if (response.success) {
            setUser(response.data.user);
          } else {
            // Token is invalid, remove it
            apiService.removeToken();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiService.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await apiService.login(credentials);
      if (response.success) {
        setUser(response.data.user);
        toast.success('Login successful!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData: { email: string; password: string; name: string }) => {
    try {
      const response = await apiService.register(userData);
      if (response.success) {
        setUser(response.data.user);
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Sync data with backend when authentication status changes
  const syncWithBackend = async () => {
    if (!isAuthenticated) return;

    try {
      // This can be called by the main app to sync ledger data
      console.log('Syncing with backend...');
      // The actual sync logic will be implemented in the main Index component
    } catch (error) {
      console.error('Backend sync failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    syncWithBackend,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};