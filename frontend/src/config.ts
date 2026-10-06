/** Backend origin, e.g. https://api.example.com (no trailing slash). */
const origin = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export const API_ORIGIN = origin;
/** Versioned API root every request goes through. */
export const API_URL = `${origin}/v1`;
