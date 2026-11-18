import React from 'react';
import { PhoneCall } from 'lucide-react';

interface AlertBannerProps {
  phone?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ phone = "112" }) => {
  return (
    <div className="border border-emergency/40 bg-surface-card text-charcoal px-4 py-3 rounded-xl mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm">
          <strong className="text-emergency">In danger right now? Don't wait for this app.</strong>{' '}
          Call 112 for police, fire and ambulance. Disaster helpline 1078. Ambulance 108.
        </p>
        <a
          href={`tel:${phone.split(' ')[0]}`}
          className="inline-flex items-center gap-1.5 h-[34px] px-3 bg-emergency text-white rounded-lg text-sm font-medium hover:bg-emergency-hover transition self-start sm:self-auto shrink-0"
        >
          <PhoneCall className="w-4 h-4" aria-hidden="true" />
          Call {phone}
        </a>
      </div>
    </div>
  );
};
