import React from 'react';
import MainLayout from '../../layouts/MainLayout';

const BackofficeDashboard = () => {
  const navItems = [
    { name: 'Dashboard', path: '/backoffice' },
    { name: 'Prosumer Management', path: '/backoffice/prosumers' },
    { name: 'Microgrid Nodes', path: '/backoffice/nodes' },
    { name: 'Energy Slots', path: '/backoffice/slots' },
    { name: 'Reservations', path: '/backoffice/reservations' },
  ];

  return (
    <MainLayout title="Backoffice Dashboard" roleNav={navItems}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Placeholder Stat Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Prosumers</p>
            <p className="text-2xl font-bold text-slate-900">124</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Nodes</p>
            <p className="text-2xl font-bold text-slate-900">8</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Reservations</p>
            <p className="text-2xl font-bold text-slate-900">42</p>
          </div>
        </div>

      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Recent Activity</h3>
        <div className="text-slate-500 text-sm py-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
          No recent activity to display. Backend connection pending.
        </div>
      </div>
    </MainLayout>
  );
};

export default BackofficeDashboard;
