import React from 'react';
import StationStatusBadge from './StationStatusBadge';

const StationDetails = ({ station, onClose }) => {
  if (!station) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-500 opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-2xl leading-6 font-semibold text-slate-900">
                  {station.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-mono">{station.stationCode}</p>
              </div>
              <StationStatusBadge status={station.status} />
            </div>

            <div className="border-t border-slate-200 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-700">Capacity</p>
                <p className="text-slate-600">{station.capacityKwh} kWh</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Battery Storage</p>
                <p className="text-slate-600">{station.batteryStorageKwh} kWh</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-semibold text-slate-700">Address</p>
                <p className="text-slate-600">{station.address}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Coordinates</p>
                <p className="text-slate-600">{station.latitude}, {station.longitude}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Operating Hours</p>
                <p className="text-slate-600">{station.openingTime} - {station.closingTime}</p>
              </div>
              <div className="md:col-span-2">
                <p className="font-semibold text-slate-700">Description</p>
                <p className="text-slate-600">{station.description || 'No description provided.'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Created At</p>
                <p className="text-slate-600">{new Date(station.createdAtUtc).toLocaleString()}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">Last Updated</p>
                <p className="text-slate-600">{new Date(station.updatedAtUtc).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StationDetails;
