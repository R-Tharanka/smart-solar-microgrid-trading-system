import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';

const BackofficeDashboard = () => {
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
    { name: 'Dashboard', path: '/backoffice' },
    { name: 'Prosumer Management', path: '/backoffice/prosumers' },
    { name: 'Microgrid Nodes', path: '/backoffice/stations' },
    { name: 'Energy Slots', path: '/backoffice/slots' },
    { name: 'Reservations', path: '/backoffice/reservations' },
  ];

  return (
    <MainLayout title="Backoffice Dashboard" roleNav={navItems}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Operational Overview</h2>
          <p className="text-sm text-slate-500">Live reservation metrics for the smart microgrid.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Reservations</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalCount}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingCount}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Approved</p>
              <p className="text-2xl font-bold text-slate-900">{stats.approvedCount}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{stats.completedCount}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Cancelled</p>
              <p className="text-2xl font-bold text-slate-900">{stats.cancelledCount}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rejected</p>
              <p className="text-2xl font-bold text-slate-900">{stats.rejectedCount}</p>
            </div>
          </div>

        </div>
      ) : null}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/backoffice/reservations" className="block p-4 text-center border rounded-lg hover:bg-slate-50 transition-colors">
            <span className="block font-medium text-blue-600 mb-1">Manage Reservations</span>
            <span className="text-xs text-slate-500">View and approve requests</span>
          </Link>
          <Link to="/backoffice/prosumers" className="block p-4 text-center border rounded-lg hover:bg-slate-50 transition-colors">
            <span className="block font-medium text-emerald-600 mb-1">Prosumer Management</span>
            <span className="text-xs text-slate-500">Monitor active accounts</span>
          </Link>
          <Link to="/backoffice/stations" className="block p-4 text-center border rounded-lg hover:bg-slate-50 transition-colors">
            <span className="block font-medium text-purple-600 mb-1">Microgrid Nodes</span>
            <span className="text-xs text-slate-500">Manage station status</span>
          </Link>
          <Link to="/backoffice/slots" className="block p-4 text-center border rounded-lg hover:bg-slate-50 transition-colors">
            <span className="block font-medium text-amber-600 mb-1">Energy Slots</span>
            <span className="text-xs text-slate-500">Configure availability</span>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default BackofficeDashboard;
