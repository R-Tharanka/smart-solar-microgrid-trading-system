import React from 'react';

const ProsumerStatusBadge = ({ status }) => {
  let bgColor = 'bg-slate-100';
  let textColor = 'text-slate-800';

  switch (status) {
    case 'Active':
      bgColor = 'bg-emerald-100';
      textColor = 'text-emerald-800';
      break;
    case 'Deactivated':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
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

export default ProsumerStatusBadge;
