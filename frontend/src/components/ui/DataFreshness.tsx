import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';

interface DataFreshnessProps {
  timestamp?: string;
  source?: string;
  isVerified?: boolean;
}

export const DataFreshness: React.FC<DataFreshnessProps> = ({
  timestamp,
  source,
  isVerified = true
}) => {
  const formatted = timestamp ? new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Recently verified';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-charcoal-muted mt-2 pt-2 border-t border-stone-200">
      <span className="flex items-center gap-1">
        <Clock className="w-3 h-3 text-stone-400" />
        Verified: {formatted}
      </span>
      {source && (
        <span className="flex items-center gap-1 font-medium text-stone-600 truncate max-w-[240px]">
          <ShieldCheck className={`w-3 h-3 ${isVerified ? 'text-emerald-600' : 'text-stone-400'}`} />
          Source: {source}
        </span>
      )}
    </div>
  );
};

