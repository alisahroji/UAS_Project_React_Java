import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { authStorage } from '../../utils/authStorage';
import { api } from '../../services/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => authStorage.hasToken());

  const fetchUser = useCallback(async () => {
    if (!authStorage.hasToken()) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const userData = await api.get('/api/auth/me');
      setUser(userData);
    } catch (error) {
      if (error.status === 401) {
        authStorage.removeToken();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      if (!authStorage.hasToken()) return;
      try {
        const userData = await api.get('/api/auth/me');
        if (mounted) setUser(userData);
      } catch (error) {
        if (error.status === 401) {
          authStorage.removeToken();
          if (mounted) setUser(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    
    init();
    
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.token) {
      authStorage.setToken(response.token);
      await fetchUser();
    }
    return response;
  };

  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response;
  };

  const logout = () => {
    authStorage.removeToken();
    setUser(null);
  };

  const contextValue = {
    user,
    token: authStorage.getToken(),
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser: fetchUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
