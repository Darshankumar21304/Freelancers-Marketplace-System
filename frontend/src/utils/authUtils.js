// Simple utility for simulating role-based authentication using localStorage

const ROLE_KEY = 'gigsphere_user_role';
const TOKEN_KEY = 'gigsphere_user_token';
const PROFILE_KEY = 'gigsphere_user_profile';

export const loginUser = (role, token, profileData = null) => {
  localStorage.setItem(ROLE_KEY, role);
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (profileData) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
  }
};

export const logoutUser = () => {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
};

export const getUserRole = () => {
  return localStorage.getItem(ROLE_KEY);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!localStorage.getItem(ROLE_KEY);
};

export const getUserProfile = () => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveUserProfile = (profileData) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
};
