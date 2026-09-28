import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';

const GridOperatorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/dashboard/summary');
      setStats(response.data.data);
    } catch (err) {
      setError('Failed to load dashboard summary. ' + (err.response?.data?.detail || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/grid-operator' },
    { name: 'Stations / Nodes', path: '/grid-operator/stations' },
    { name: 'Slots', path: '/grid-operator/slots' },
    { name: 'Bookings / Reservations', path: '/grid-operator/reservations' },
  ];

  return (
    <MainLayout title="Grid Operator Dashboard" roleNav={navItems}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Grid Operations Overview</h2>
          <p className="text-sm text-slate-500">Monitor reservation metrics and microgrid activity.</p>
        </div>
        <button
          onClick={fetchStats}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500">
          Loading dashboard metrics...
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Total Reservations</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalCount}</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Pending Approval</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingCount}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Approved Bookings</h3>
            <p className="text-3xl font-bold text-emerald-600">{stats.approvedCount}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Completed</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.completedCount}</p>
          </div>

        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Quick Navigation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/grid-operator/stations" className="block p-4 text-center border rounded-lg hover:bg-slate-50 transition-colors">
            <span className="block font-medium text-purple-600 mb-1">View Stations</span>
            <span className="text-xs text-slate-500">Monitor active microgrid nodes</span>
          </Link>
          <Link to="/grid-operator/slots" className="block p-4 text-center border rounded-lg hover:bg-slate-50 transition-colors">
            <span className="block font-medium text-amber-600 mb-1">View Energy Slots</span>
            <span className="text-xs text-slate-500">Check current availability</span>
          </Link>
          <Link to="/grid-operator/reservations" className="block p-4 text-center border rounded-lg hover:bg-slate-50 transition-colors">
            <span className="block font-medium text-blue-600 mb-1">View Reservations</span>
            <span className="text-xs text-slate-500">Track booking status</span>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default GridOperatorDashboard;
