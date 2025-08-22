import React from 'react';
import { Clock, AlertTriangle, CheckCircle, Pill, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle, MobileCardDescription } from '@/components/ui/mobile/MobileCard';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/TranslatedText';
import { formatDistanceToNow } from 'date-fns';
import { useDashboardData } from '@/hooks/useDashboardData';

const RecentScansCarousel: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardStats, loading } = useDashboardData();

  const recentScans = dashboardStats.scans.recent.map(scan => {
    const medicationName = scan.products?.brand_name || 
                          scan.extractions?.extracted_json?.brand_name || 
                          'Unknown Medication';
    
    const status = medicationName === 'Unknown Medication' ? 'unknown' : 'identified';
    const confidence = scan.extractions?.quality_score ? Math.round(scan.extractions.quality_score * 100) : 0;

    return {
      id: scan.id,
      medicationName,
      status,
      timestamp: new Date(scan.created_at),
      type: scan.products?.brand_name ? 'Identified' : 'Unknown',
      confidence
    };
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'identified':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'unknown':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Pill className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'identified':
        return 'success';
      case 'unknown':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleViewAll = () => {
    navigate('/history');
  };

  const handleScanClick = (scanId: string) => {
    navigate(`/history?scan=${scanId}`);
  };

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          <TranslatedText translationKey="dashboard.recentScans" fallback="Recent Scans" />
        </h2>
        <button
          onClick={handleViewAll}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary-glow transition-colors"
        >
          <TranslatedText translationKey="dashboard.viewAll" fallback="View All" />
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[280px] h-32 bg-muted/50 rounded-2xl animate-pulse flex-shrink-0" />
          ))}
        </div>
      ) : recentScans.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {recentScans.map((scan) => (
            <MobileCard
              key={scan.id}
              variant={getStatusVariant(scan.status) as any}
              interactive
              onClick={() => handleScanClick(scan.id)}
              className="min-w-[280px] flex-shrink-0"
            >
              <MobileCardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(scan.status)}
                    <Badge variant={scan.type === 'Rx' ? 'default' : 'secondary'} className="text-xs">
                      {scan.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(scan.timestamp, { addSuffix: true })}
                  </div>
                </div>
                <MobileCardTitle className="text-base line-clamp-1">
                  {scan.medicationName}
                </MobileCardTitle>
              </MobileCardHeader>
              <MobileCardContent>
                {scan.status === 'identified' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      <TranslatedText translationKey="scanner.confidence" fallback="Confidence" />
                    </span>
                    <span className="text-xs font-medium text-success">
                      {scan.confidence}%
                    </span>
                  </div>
                )}
                {scan.status === 'unknown' && (
                  <MobileCardDescription className="text-xs">
                    <TranslatedText 
                      translationKey="scanner.unknownMedication" 
                      fallback="Tap to try scanning again or add manually" 
                    />
                  </MobileCardDescription>
                )}
              </MobileCardContent>
            </MobileCard>
          ))}
        </div>
      ) : (
        <MobileCard variant="outline" className="text-center py-8">
          <MobileCardContent>
            <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <MobileCardTitle className="text-base mb-2">
              <TranslatedText translationKey="dashboard.noScans" fallback="No recent scans" />
            </MobileCardTitle>
            <MobileCardDescription>
              <TranslatedText 
                translationKey="dashboard.noScansDescription" 
                fallback="Start by scanning your first medication" 
              />
            </MobileCardDescription>
          </MobileCardContent>
        </MobileCard>
      )}
    </div>
  );
};

export default RecentScansCarousel;