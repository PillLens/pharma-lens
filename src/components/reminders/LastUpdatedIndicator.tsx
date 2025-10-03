import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LastUpdatedIndicatorProps {
  lastUpdated: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const LastUpdatedIndicator: React.FC<LastUpdatedIndicatorProps> = ({
  lastUpdated,
  onRefresh,
  isRefreshing = false
}) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      setTimeAgo(formatDistanceToNow(lastUpdated, { addSuffix: true }));
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground px-4 py-2">
      <span>Last updated {timeAgo}</span>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-auto p-1 hover:bg-muted rounded-full transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default LastUpdatedIndicator;
