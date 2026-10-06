import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserRole, isAuthenticated } from '../utils/authUtils';

export default function ProtectedRoute({ children, allowedRole }) {
  if (!isAuthenticated()) {
    // Redirect to login if not logged in
    return <Navigate to="/auth/login" replace />;
  }

  const role = getUserRole();

  if (allowedRole && role !== allowedRole) {
    // Redirect to their own dashboard if trying to access another role's dashboard
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return children;
}
