import { useContext } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { FullPageLoading } from './components/ui/PageState';
import { AuthContext } from './context/AuthContext';
import AccessDenied from './pages/AccessDenied';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Profile from './pages/account/Profile';
import Security from './pages/account/Security';
import BackofficeDashboard from './pages/backoffice/Dashboard';
import Prosumers from './pages/backoffice/Prosumers';
import Reservations from './pages/backoffice/Reservations';
import Slots from './pages/backoffice/Slots';
import Staff from './pages/backoffice/Staff';
import Stations from './pages/backoffice/Stations';
import GridOperatorDashboard from './pages/gridoperator/Dashboard';
import ProsumerHome from './pages/prosumer/Home';
import ProtectedRoute, { PublicOnlyRoute } from './routes/ProtectedRoute';

const allRoles = ['Backoffice', 'GridOperator', 'Prosumer'];

function WorkspaceRedirect() {
  const { user, loading, homePath } = useContext(AuthContext);
  if (loading) return <FullPageLoading />;
  return <Navigate to={user ? homePath : '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

        <Route path="/backoffice" element={<ProtectedRoute allowedRoles={['Backoffice']}><BackofficeDashboard /></ProtectedRoute>} />
        <Route path="/backoffice/staff" element={<ProtectedRoute allowedRoles={['Backoffice']}><Staff /></ProtectedRoute>} />
        <Route path="/backoffice/prosumers" element={<ProtectedRoute allowedRoles={['Backoffice']}><Prosumers /></ProtectedRoute>} />
        <Route path="/backoffice/stations" element={<ProtectedRoute allowedRoles={['Backoffice']}><Stations /></ProtectedRoute>} />
        <Route path="/backoffice/slots" element={<ProtectedRoute allowedRoles={['Backoffice']}><Slots /></ProtectedRoute>} />
        <Route path="/backoffice/reservations" element={<ProtectedRoute allowedRoles={['Backoffice']}><Reservations /></ProtectedRoute>} />

        <Route path="/grid-operator" element={<ProtectedRoute allowedRoles={['GridOperator']}><GridOperatorDashboard /></ProtectedRoute>} />
        <Route path="/grid-operator/stations" element={<ProtectedRoute allowedRoles={['GridOperator']}><Stations /></ProtectedRoute>} />
        <Route path="/grid-operator/slots" element={<ProtectedRoute allowedRoles={['GridOperator']}><Slots /></ProtectedRoute>} />
        <Route path="/grid-operator/reservations" element={<ProtectedRoute allowedRoles={['GridOperator']}><Reservations /></ProtectedRoute>} />

        <Route path="/prosumer" element={<ProtectedRoute allowedRoles={['Prosumer']}><ProsumerHome /></ProtectedRoute>} />
        <Route path="/account/profile" element={<ProtectedRoute allowedRoles={allRoles}><Profile /></ProtectedRoute>} />
        <Route path="/account/security" element={<ProtectedRoute allowedRoles={allRoles}><Security /></ProtectedRoute>} />
        <Route path="/access-denied" element={<ProtectedRoute allowedRoles={allRoles}><AccessDenied /></ProtectedRoute>} />

        <Route path="/" element={<WorkspaceRedirect />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
