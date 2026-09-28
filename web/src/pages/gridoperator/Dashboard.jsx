import React from 'react';
import MainLayout from '../../layouts/MainLayout';

const GridOperatorDashboard = () => {
  const navItems = [
    { name: 'Dashboard', path: '/grid-operator' },
    { name: 'Stations / Nodes', path: '/grid-operator/stations' },
    { name: 'Slots', path: '/grid-operator/slots' },
    { name: 'Bookings / Reservations', path: '/grid-operator/bookings' },
  ];

  return (
    <MainLayout title="Grid Operator Dashboard" roleNav={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Grid Status</h3>
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-lg font-semibold text-slate-800">Operational</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Power Distributed (Today)</h3>
          <p className="text-2xl font-bold text-slate-800">1,250 kWh</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Active Nodes Overview</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Node ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Capacity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {/* Placeholder Data */}
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">NODE-001</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">North Sector</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">Active</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">500 kW</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">NODE-002</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">East Sector</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">Maintenance</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">250 kW</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default GridOperatorDashboard;
