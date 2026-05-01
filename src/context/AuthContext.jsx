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

  // ─── LOGIN 
  const login = useCallback(async (email, password) => {
   
    const res = await apiLogin({ email, password });
    const { token: t } = res.data;

    
    const payload = JSON.parse(atob(t.split('.')[1]));

    const userData = {
      _id:   payload.id,
      role:  payload.role,
      email,
     
      name: payload.name || '',
    };

    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(t);
    setUser(userData);
    return userData;
  }, []);

  // ─── SIGNUP 
  const signupUser = useCallback(async ({ name, email, password, role }) => {
   
    await apiSignup({ name, email, password, role });

   
    const loginRes = await apiLogin({ email, password });
    const { token: t } = loginRes.data;


    const payload = JSON.parse(atob(t.split('.')[1]));

    const userData = {
      _id:  payload.id,
      role: payload.role,
      email,
  
      name,
    };

    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(t);
    setUser(userData);
    return userData;
  }, []);

  // ─── LOGOUT 
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
