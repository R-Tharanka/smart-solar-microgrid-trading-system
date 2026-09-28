import React from 'react';

const ReservationStatusBadge = ({ status }) => {
  let bgColor = 'bg-slate-100';
  let textColor = 'text-slate-800';

  switch (status) {
    case 'Pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'Approved':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case 'Rejected':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'Cancelled':
      bgColor = 'bg-slate-200';
      textColor = 'text-slate-600';
      break;
    case 'QrIssued':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      break;
    case 'Verified':
      bgColor = 'bg-indigo-100';
      textColor = 'text-indigo-800';
      break;
    case 'Completed':
      bgColor = 'bg-emerald-100';
      textColor = 'text-emerald-800';
      break;
    case 'Expired':
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
      break;
    default:
      break;
  }

  return (
    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default ReservationStatusBadge;
