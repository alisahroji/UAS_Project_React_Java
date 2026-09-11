const TOKEN_KEY = 'devlink_auth_token';

export const authStorage = {
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  
  removeToken: () => {
    localStorage.removeItem(TOKEN_KEY);
  },
  
  hasToken: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};
