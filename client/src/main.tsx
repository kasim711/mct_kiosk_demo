import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Support deploying frontend on Vercel with remote backend URL
const originalFetch = window.fetch;
const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

if (apiUrl) {
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${apiUrl}${input}`;
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
