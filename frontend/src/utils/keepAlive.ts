/**
 * Keep-alive utility to prevent backend from sleeping on free hosting services
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://el-deras-writes-backend.onrender.com';

/**
 * Ping the backend to keep it awake
 */
export const pingBackend = async (): Promise<boolean> => {
  try {
    // Use a lightweight endpoint to ping the backend
    const response = await fetch(`${API_URL}/categories/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('Backend ping successful');
      return true;
    } else {
      console.warn('Backend ping failed with status:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('Backend ping failed:', error);
    return false;
  }
};

/**
 * Start the keep-alive service
 * Pings the backend every 10 minutes to prevent it from sleeping
 */
export const startKeepAlive = (): (() => void) => {
  console.log('Starting backend keep-alive service...');
  
  // Initial ping
  pingBackend();
  
  // Set up interval to ping every 10 minutes (600,000 ms)
  const intervalId = setInterval(() => {
    pingBackend();
  }, 10 * 60 * 1000);
  
  // Return cleanup function
  return () => {
    console.log('Stopping backend keep-alive service...');
    clearInterval(intervalId);
  };
};

/**
 * Start keep-alive only in production
 */
export const startKeepAliveIfProduction = (): (() => void) | null => {
  // Only run keep-alive in production (when using the deployed backend)
  if (API_URL.includes('onrender.com') || import.meta.env.PROD) {
    return startKeepAlive();
  }
  
  console.log('Keep-alive service disabled in development');
  return null;
};