import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'resource' | 'request' | 'verification' | 'severity';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'resource' }) => {
  const norm = (status || '').toLowerCase().replace(/_/g, ' ');

  let bgClass = "bg-stone-200 text-stone-700";

  if (['available', 'fulfilled', 'verified', 'active'].includes(norm)) {
    bgClass = "bg-emerald-100 text-emerald-800 border border-emerald-300";
  } else if (['in progress', 'assigned', 'moderate', 'limited'].includes(norm)) {
    bgClass = "bg-sky-100 text-sky-800 border border-sky-300";
  } else if (['submitted', 'pending', 'preparing', 'monitoring'].includes(norm)) {
    bgClass = "bg-amber-100 text-amber-800 border border-amber-300";
  } else if (['critical', 'severe', 'out of stock', 'unable to fulfill', 'closed'].includes(norm)) {
    bgClass = "bg-red-100 text-red-800 border border-red-300";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize tracking-wide ${bgClass}`}>
      {norm}
    </span>
  );
};

