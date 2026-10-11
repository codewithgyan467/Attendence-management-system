export const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};

export const API_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001'))
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
