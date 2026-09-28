import React from 'react';

const SlotStatusBadge = ({ status }) => {
  let bgColor = 'bg-slate-100';
  let textColor = 'text-slate-800';

  switch (status) {
    case 'Available':
      bgColor = 'bg-emerald-100';
      textColor = 'text-emerald-800';
      break;
    case 'Unavailable':
      bgColor = 'bg-slate-100';
      textColor = 'text-slate-800';
      break;
    case 'FullyBooked':
      bgColor = 'bg-amber-100';
      textColor = 'text-amber-800';
      break;
    case 'Active': // Assuming this could be a status based on naming conventions, though Available/Unavailable are main
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
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

export default SlotStatusBadge;
