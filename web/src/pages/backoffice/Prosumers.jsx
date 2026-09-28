import React, { useState, useEffect, useContext } from 'react';
import MainLayout from '../../layouts/MainLayout';
import apiClient from '../../services/api';
import ProsumerStatusBadge from '../../components/prosumers/ProsumerStatusBadge';
import ProsumerDetails from '../../components/prosumers/ProsumerDetails';
import { AuthContext } from '../../context/AuthContext';

const Prosumers = () => {
  const { user } = useContext(AuthContext);
  const isBackoffice = user?.role === 'Backoffice';
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProsumer, setSelectedProsumer] = useState(null);

  // Filtering states
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/users');
      // Filter out non-prosumers
      const prosumersOnly = response.data.data.filter(u => u.role === 'Prosumer');
      setUsers(prosumersOnly);
    } catch (err) {
      setError('Failed to load prosumers. ' + (err.response?.data?.detail || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleView = (prosumer) => {
    setSelectedProsumer(prosumer);
    setShowDetails(true);
  };

  const handleStatusChange = async (prosumerNic, currentStatus) => {
    if (!prosumerNic) {
      alert("Prosumer NIC is missing.");
      return;
    }

    const action = currentStatus === 'Active' ? 'deactivate' : 'reactivate';
    const confirmMessage = `Are you sure you want to ${action} prosumer ${prosumerNic}?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      await apiClient.post(`/users/${prosumerNic}/${action}`);
      fetchUsers();
    } catch (err) {
      alert(`Failed to ${action}: ` + (err.response?.data?.detail || err.response?.data?.message || 'Unknown error'));
    }
  };

  // Derived state for filtering
  const filteredProsumers = users.filter(p => {
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (p.nic && p.nic.toLowerCase().includes(searchLower)) ||
      (p.firstName && p.firstName.toLowerCase().includes(searchLower)) ||
      (p.lastName && p.lastName.toLowerCase().includes(searchLower)) ||
      (p.email && p.email.toLowerCase().includes(searchLower));
    
    return matchesStatus && matchesSearch;
  });

  const navItems = isBackoffice ? [
    { name: 'Dashboard', path: '/backoffice' },
    { name: 'Prosumer Management', path: '/backoffice/prosumers' },
    { name: 'Microgrid Nodes', path: '/backoffice/stations' },
    { name: 'Energy Slots', path: '/backoffice/slots' },
    { name: 'Reservations', path: '/backoffice/reservations' },
  ] : [];

  return (
    <MainLayout title="Prosumer Management" roleNav={navItems}>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Prosumer Management</h2>
          <p className="text-sm text-slate-500">View and manage prosumer profiles and account status.</p>
        </div>
        
        <button
          onClick={fetchUsers}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search NIC, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="w-full md:w-1/4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">NIC</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Loading prosumers...
                  </td>
                </tr>
              ) : filteredProsumers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No prosumers found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredProsumers.map((prosumer) => (
                  <tr key={prosumer.email} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                      {prosumer.nic}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{prosumer.firstName} {prosumer.lastName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{prosumer.email}</div>
                      <div className="text-xs text-slate-500">{prosumer.phoneNumber || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ProsumerStatusBadge status={prosumer.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => handleView(prosumer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      
                      {isBackoffice && (
                        <button 
                          onClick={() => handleStatusChange(prosumer.nic, prosumer.status)}
                          className={`${prosumer.status === 'Active' ? 'text-red-600 hover:text-red-900' : 'text-emerald-600 hover:text-emerald-900'}`}
                        >
                          {prosumer.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetails && (
        <ProsumerDetails 
          prosumer={selectedProsumer} 
          onClose={() => {
            setShowDetails(false);
            setSelectedProsumer(null);
          }} 
        />
      )}
    </MainLayout>
  );
};

export default Prosumers;
