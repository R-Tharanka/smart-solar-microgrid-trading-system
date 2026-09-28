import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import BackofficeDashboard from './pages/backoffice/Dashboard';
import GridOperatorDashboard from './pages/gridoperator/Dashboard';
import Stations from './pages/backoffice/Stations';
import Slots from './pages/backoffice/Slots';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Backoffice Routes */}
        <Route path="/backoffice" element={
          <ProtectedRoute allowedRoles={['Backoffice']}>
            <BackofficeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/backoffice/stations" element={
          <ProtectedRoute allowedRoles={['Backoffice']}>
            <Stations />
          </ProtectedRoute>
        } />
        <Route path="/backoffice/slots" element={
          <ProtectedRoute allowedRoles={['Backoffice']}>
            <Slots />
          </ProtectedRoute>
        } />

        {/* Grid Operator Routes */}
        <Route path="/grid-operator" element={
          <ProtectedRoute allowedRoles={['GridOperator']}>
            <GridOperatorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/grid-operator/stations" element={
          <ProtectedRoute allowedRoles={['GridOperator']}>
            <Stations />
          </ProtectedRoute>
        } />
        <Route path="/grid-operator/slots" element={
          <ProtectedRoute allowedRoles={['GridOperator']}>
            <Slots />
          </ProtectedRoute>
        } />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
