import { useState, useEffect } from 'react';

const CART_SESSION_KEY = 'otto-art-cart-session';

function generateSessionId(): string {
  return crypto.randomUUID();
}

export function useCartSession(): string {
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CART_SESSION_KEY);
      if (stored) {
        return stored;
      }
      const newId = generateSessionId();
      localStorage.setItem(CART_SESSION_KEY, newId);
      return newId;
    }
    return '';
  });

  useEffect(() => {
    if (!sessionId && typeof window !== 'undefined') {
      const stored = localStorage.getItem(CART_SESSION_KEY);
      if (stored) {
        setSessionId(stored);
      } else {
        const newId = generateSessionId();
        localStorage.setItem(CART_SESSION_KEY, newId);
        setSessionId(newId);
      }
    }
  }, [sessionId]);

  return sessionId;
}

export function getCartSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem(CART_SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(CART_SESSION_KEY, sessionId);
  }
  return sessionId;
}
