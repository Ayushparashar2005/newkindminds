import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DemoBannerProps {
  message?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  message = "SIMULATED / DEMO ENVIRONMENT: Records marked [DEMO] are generated for humanitarian exercises and development testing. Do not treat as real live rescue dispatch."
}) => {
  return (
    <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-900 px-4 py-2.5 rounded-r shadow-sm text-xs md:text-sm flex items-center gap-2 mb-4">
      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

