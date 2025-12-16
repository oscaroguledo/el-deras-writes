import React, { createContext, useContext, ReactNode } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { database } from '../utils/database';

interface DatabaseContextType {
  database: typeof database;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const databaseState = useDatabase();

  return (
    <DatabaseContext.Provider value={databaseState}>
      {children}
    </DatabaseContext.Provider>
  );
};