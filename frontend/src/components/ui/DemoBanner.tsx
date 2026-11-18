import React from 'react';
import { Info } from 'lucide-react';

interface DemoBannerProps {
  message?: string;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  message = "Agencies, hospitals, helplines and NDRF units listed here are real Indian public services. Numbers and centres change during an emergency, so confirm with the official helpline before you travel."
}) => {
  return (
    <div className="border border-stone-200 bg-surface-raised text-charcoal-muted px-4 py-2.5 rounded-xl text-[13px] flex items-start gap-2 mb-4">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
};
