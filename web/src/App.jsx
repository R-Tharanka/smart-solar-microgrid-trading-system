import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import BackofficeDashboard from './pages/backoffice/Dashboard';
import GridOperatorDashboard from './pages/gridoperator/Dashboard';

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

        {/* Grid Operator Routes */}
        <Route path="/grid-operator" element={
          <ProtectedRoute allowedRoles={['GridOperator']}>
            <GridOperatorDashboard />
          </ProtectedRoute>
        } />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
