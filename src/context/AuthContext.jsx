import React, { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    // ✅ FIX: No try/catch here — let the error bubble up to Login.jsx
    // so it can show the toast and re-enable the button correctly.
    const res = await apiLogin({ email, password });
    const { token: t } = res.data;

    // Decode JWT payload to get id + role
    const payload = JSON.parse(atob(t.split('.')[1]));

    const userData = {
      _id:   payload.id,
      role:  payload.role,
      email,
      // ✅ FIX: name isn't in the JWT payload (backend doesn't include it).
      // We store what we have; name will be undefined here — that's fine,
      // the greeting falls back to 'there'. If you want the name shown,
      // see the backend note below.
      name: payload.name || '',
    };

    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(t);
    setUser(userData);
    return userData;
  }, []);

  // ─── SIGNUP ─────────────────────────────────────────────────────────────────
  const signupUser = useCallback(async ({ name, email, password, role }) => {
    // ✅ FIX: The original had a try/catch that swallowed the error and
    // showed a toast internally — but then returned undefined instead of
    // throwing, so Signup.jsx's catch block never ran and navigate() was
    // never called on success either. Solution: NO try/catch here.
    // Let errors propagate to Signup.jsx which handles toasts + navigation.

    // Step 1 — create the account
    await apiSignup({ name, email, password, role });

    // Step 2 — log in immediately to get the token
    const loginRes = await apiLogin({ email, password });
    const { token: t } = loginRes.data;

    // Step 3 — decode + store
    const payload = JSON.parse(atob(t.split('.')[1]));

    const userData = {
      _id:  payload.id,
      role: payload.role,
      email,
      // ✅ FIX: store the name from the signup form since the JWT
      // payload from your backend doesn't include it.
      name,
    };

    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(t);
    setUser(userData);
    return userData;
  }, []);

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, login, signup: signupUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
