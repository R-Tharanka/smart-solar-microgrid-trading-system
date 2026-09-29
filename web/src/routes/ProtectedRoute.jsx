import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FullPageLoading } from '../components/ui/PageState';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return <FullPageLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export const PublicOnlyRoute = ({ children }) => {
  const { user, loading, homePath } = useContext(AuthContext);
  if (loading) return <FullPageLoading />;
  if (user) return <Navigate to={homePath} replace />;
  return children;
};

export default ProtectedRoute;
