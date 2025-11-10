import { useContext } from 'react';
import { AuthContext, AuthContextType } from './AuthContext';

export function useAuth() {
  const context = useContext<AuthContextType | undefined>(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
