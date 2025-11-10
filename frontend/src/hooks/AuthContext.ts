import { createContext } from 'react';
import { CustomUser } from '../types/CustomUser';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: CustomUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
