import React from 'react';
import { ShieldAlert, PhoneCall } from 'lucide-react';

interface AlertBannerProps {
  phone?: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ phone = "112 / 911" }) => {
  return (
    <div className="bg-red-50 border-l-4 border-emergency text-charcoal px-4 py-3 rounded-r neu-card-interactive mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-emergency flex-shrink-0" />
          <p className="text-xs sm:text-sm font-medium">
            <strong className="text-emergency font-bold">EMERGENCY PROTOCOL:</strong> KindMinds is an informational coordination platform, not an emergency 911/112 dispatch service.
          </p>
        </div>
        <a
          href={`tel:${phone.split(' ')[0]}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emergency text-white rounded text-xs font-semibold hover:bg-emergency-hover transition self-start sm:self-auto shadow-sm"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          Emergency: {phone}
        </a>
      </div>
    </div>
  );
};

