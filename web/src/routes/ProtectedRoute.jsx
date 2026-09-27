import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their appropriate dashboard if they try to access an unauthorized route
    if (user.role === 'Backoffice') return <Navigate to="/backoffice" replace />;
    if (user.role === 'GridOperator') return <Navigate to="/grid-operator" replace />;
    
    // Fallback to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
