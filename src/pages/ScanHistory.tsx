import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  RefreshCw, 
  Archive, 
  BookmarkPlus,
  Calendar,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Star,
  Sparkles,
  History,
  Target,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from "@/components/ui/mobile/MobileCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BottomSheet from "@/components/ui/mobile/BottomSheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslatedText } from "@/components/TranslatedText";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import ProfessionalMobileLayout from "@/components/mobile/ProfessionalMobileLayout";
import PullToRefreshWrapper from "@/components/mobile/PullToRefreshWrapper";
import { cn } from "@/lib/utils";

interface ScanSession {
  id: string;
  created_at: string;
  barcode_value?: string;
  language: string;
  extraction_id?: string;
  selected_product_id?: string;
  extractions?: {
    extracted_json: any;
    quality_score: number;
    risk_flags: string[];
  };
  products?: {
    brand_name: string;
    generic_name?: string;
    strength?: string;
    form?: string;
  };
}

// Enhanced timeline scan card component
const TimelineScanCard = ({ 
  session, 
  isBookmarked, 
  onView, 
  onBookmark, 
  onDelete, 
  onExport,
  isLast = false,
  deletingSessionId 
}: {
  session: ScanSession;
  isBookmarked: boolean;
  onView: (session: ScanSession) => void;
  onBookmark: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (session: ScanSession) => void;
  isLast?: boolean;
  deletingSessionId?: string | null;
}) => {
  const medication = session.products || session.extractions?.extracted_json;
  const qualityScore = session.extractions?.quality_score || 0;
  const riskFlags = session.extractions?.risk_flags || [];
  const isUnknown = !medication?.brand_name || medication?.brand_name === "Unknown Medication";
  const hasHighRisk = riskFlags.length > 0;

  const getCardVariant = () => {
    if (hasHighRisk) return 'border-red-400/30 bg-gradient-to-br from-red-50/50 to-red-100/30';
    if (isUnknown) return 'border-amber-400/30 bg-gradient-to-br from-amber-50/50 to-amber-100/30';
    if (qualityScore >= 0.8) return 'border-green-400/30 bg-gradient-to-br from-green-50/50 to-green-100/30';
    return 'border-blue-400/30 bg-gradient-to-br from-blue-50/50 to-blue-100/30';
  };

  const getStatusIcon = () => {
    if (hasHighRisk) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (isUnknown) return <Target className="w-5 h-5 text-amber-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const getTimelineColor = () => {
    if (hasHighRisk) return 'bg-red-500';
    if (isUnknown) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="relative">
      {/* Timeline connector */}
      <div className="absolute left-6 top-12 w-0.5 h-full bg-gradient-to-b from-border via-border/50 to-transparent" 
           style={{ display: isLast ? 'none' : 'block' }} />
      
      {/* Timeline dot */}
      <div className="absolute left-4 top-4 z-10">
        <div className={cn(
          "w-5 h-5 rounded-full border-2 border-background shadow-md animate-pulse",
          getTimelineColor()
        )} />
      </div>

      {/* Card content */}
      <div className="ml-12 mb-6">
        <MobileCard 
          className={cn(
            "shadow-soft hover:shadow-elevated transition-all duration-300 hover:scale-[1.01] border-0",
            getCardVariant()
          )}
          interactive
          onClick={() => onView(session)}
        >
          <MobileCardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Status row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <Badge 
                      variant="outline"
                       className={cn(
                        "text-xs font-medium border px-2 py-1",
                        hasHighRisk && "border-red-400/50 text-red-700 bg-red-50/50",
                        isUnknown && "border-amber-400/50 text-amber-700 bg-amber-50/50",
                        !hasHighRisk && !isUnknown && "border-green-400/50 text-green-700 bg-green-50/50"
                      )}
                    >
                      {hasHighRisk ? <TranslatedText translationKey="history.highRisk" /> : 
                       isUnknown ? <TranslatedText translationKey="history.unknown" /> : 
                       <TranslatedText translationKey="history.identified" />}
                    </Badge>
                  </div>
                  
                  {session.barcode_value && (
                    <Badge variant="outline" className="text-xs bg-blue-50/50 text-blue-700 border-blue-400/50">
                      <TranslatedText translationKey="history.barcode" />
                    </Badge>
                  )}
                  
                  {isBookmarked && (
                    <Badge variant="outline" className="text-xs bg-purple-50/50 text-purple-700 border-purple-400/50">
                      <Star className="w-3 h-3 mr-1" />
                      <TranslatedText translationKey="history.saved" />
                    </Badge>
                  )}
                </div>

                {/* Medication info */}
                <MobileCardTitle className="text-lg font-bold mb-2 line-clamp-2">
                  {medication?.brand_name || <TranslatedText translationKey="medications.unknownMedication" />}
                </MobileCardTitle>
                
                {medication?.generic_name && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                    {medication.generic_name}
                    {medication.strength && ` • ${medication.strength}`}
                    {medication.form && ` • ${medication.form}`}
                  </p>
                )}

                {/* Time info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{format(new Date(session.created_at), 'MMM d, yyyy • h:mm a')}</span>
                </div>
              </div>

              {/* Quality and actions */}
              <div className="flex flex-col items-end gap-2 ml-4">
                {qualityScore > 0 && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      qualityScore >= 0.8 && "bg-green-50/50 text-green-700 border-green-400/50",
                      qualityScore >= 0.6 && qualityScore < 0.8 && "bg-amber-50/50 text-amber-700 border-amber-400/50",
                      qualityScore < 0.6 && "bg-red-50/50 text-red-700 border-red-400/50"
                    )}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {Math.round(qualityScore * 100)}%
                  </Badge>
                )}
                
                {riskFlags.length > 0 && (
                  <Badge className="text-xs bg-red-500 text-white animate-pulse">
                    <Shield className="w-3 h-3 mr-1" />
                    {riskFlags.length} <TranslatedText translationKey={riskFlags.length > 1 ? "history.alerts" : "history.alert"} />
                  </Badge>
                )}
              </div>
            </div>
          </MobileCardHeader>

          <MobileCardContent>
            {/* Risk alerts */}
            {riskFlags.length > 0 && (
              <div className="mb-4 p-3 bg-red-50/80 border border-red-200/50 rounded-xl">
                <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <TranslatedText translationKey="safety.alerts" />
                </h4>
                <div className="space-y-1">
                  {riskFlags.slice(0, 2).map((flag, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-red-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <span className="flex-1">{flag}</span>
                    </div>
                  ))}
                  {riskFlags.length > 2 && (
                    <p className="text-xs text-red-600 mt-2 pl-3">
                      +{riskFlags.length - 2} <TranslatedText translationKey={riskFlags.length - 2 > 1 ? "history.moreAlerts" : "history.moreAlert"} />
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Unknown medication help */}
            {isUnknown && (
              <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">
                      <TranslatedText translationKey="history.medicationNotIdentified" />
                    </h4>
                    <p className="text-xs text-amber-700">
                      <TranslatedText translationKey="history.improveScanning" />
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(session);
                  }}
                  className="text-xs h-8 px-3"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  <TranslatedText translationKey="common.view" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(session);
                  }}
                  className="text-xs h-8 px-3"
                >
                  <Download className="w-3 h-3 mr-1" />
                  <TranslatedText translationKey="history.export" />
                </Button>
              </div>
              
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark(session.id);
                  }}
                  className={cn(
                    "w-8 h-8 p-0",
                    isBookmarked && "text-purple-600"
                  )}
                >
                  <Star className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="w-8 h-8 p-0 text-red-500 hover:text-red-600"
                  disabled={deletingSessionId === session.id}
                >
                  {deletingSessionId === session.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </MobileCardContent>
        </MobileCard>
      </div>
    </div>
  );
};

// Enhanced skeleton for timeline
const TimelineLoadingSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="space-y-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="relative">
        <div className="absolute left-4 top-4 w-5 h-5 bg-muted rounded-full animate-pulse" />
        <div className="ml-12">
          <MobileCard className="animate-pulse">
            <MobileCardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-muted rounded" />
                    <div className="w-16 h-5 bg-muted rounded-full" />
                  </div>
                  <div className="w-3/4 h-6 bg-muted rounded mb-2" />
                  <div className="w-1/2 h-4 bg-muted rounded mb-3" />
                  <div className="w-24 h-3 bg-muted rounded" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-5 bg-muted rounded-full" />
                </div>
              </div>
            </MobileCardHeader>
            <MobileCardContent>
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <div className="w-16 h-8 bg-muted rounded" />
                  <div className="w-16 h-8 bg-muted rounded" />
                </div>
                <div className="flex gap-1">
                  <div className="w-8 h-8 bg-muted rounded" />
                  <div className="w-8 h-8 bg-muted rounded" />
                </div>
              </div>
            </MobileCardContent>
          </MobileCard>
        </div>
      </div>
    ))}
  </div>
);

export const ScanHistory = () => {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const fetchScanHistory = async (showRefreshing = false) => {
    if (!user) return;

    try {
      if (showRefreshing) setRefreshing(true);
      
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          created_at,
          barcode_value,
          language,
          extraction_id,
          selected_product_id,
          extractions (
            extracted_json,
            quality_score,
            risk_flags
          ),
          products (
            brand_name,
            generic_name,
            strength,
            form
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setSessions(data || []);
      
      if (showRefreshing && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error fetching scan history:', error);
      toast({
        title: t('toast.loadingError'),
        description: t('history.loadError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchScanHistory(true);
  };

  const handleBookmark = (sessionId: string) => {
    const newBookmarked = new Set(bookmarkedSessions);
    if (newBookmarked.has(sessionId)) {
      newBookmarked.delete(sessionId);
      toast({
        title: t('toast.removedFromSaved'),
        description: t('history.removedFromSaved'),
      });
    } else {
      newBookmarked.add(sessionId);
      toast({
        title: t('toast.savedSuccessfully'),
        description: t('history.addedToSaved'),
      });
    }
    setBookmarkedSessions(newBookmarked);
  };

  const handleDeleteConfirm = (sessionId: string) => {
    setSessionToDelete(sessionId);
  };

  const handleDelete = async () => {
    if (!sessionToDelete || !user) return;
    
    try {
      setDeletingSessionId(sessionToDelete);
      
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionToDelete)
        .eq('user_id', user.id);

      if (error) {
        console.error('Database deletion error:', error);
        throw new Error('Failed to delete from database');
      }

      // Only update UI state after successful database deletion
      setSessions(prevSessions => prevSessions.filter(s => s.id !== sessionToDelete));
      const newBookmarked = new Set(bookmarkedSessions);
      newBookmarked.delete(sessionToDelete);
      setBookmarkedSessions(newBookmarked);
      
      toast({
        title: t('history.deletedSuccessfully'),
        description: t('history.deletedSuccessfullyDescription'),
      });
      
      if (navigator.vibrate) {
        navigator.vibrate([50, 50]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: t('toast.deleteFailed'),
        description: t('history.deleteError'),
        variant: "destructive",
      });
    } finally {
      setDeletingSessionId(null);
      setSessionToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setSessionToDelete(null);
  };

  const exportSession = (session: ScanSession) => {
    const exportData = {
      scannedAt: session.created_at,
      barcode: session.barcode_value,
      medication: session.products || session.extractions?.extracted_json,
      qualityScore: session.extractions?.quality_score,
      riskFlags: session.extractions?.risk_flags,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medication-scan-${session.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Scan data exported successfully.",
    });
  };

  const [selectedSession, setSelectedSession] = useState<ScanSession | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  const handleViewSession = (session: ScanSession) => {
    setSelectedSession(session);
    setShowSessionDialog(true);
  };

  useEffect(() => {
    fetchScanHistory();
  }, [user]);

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = searchTerm === "" || 
      session.products?.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.extractions?.extracted_json?.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.barcode_value?.includes(searchTerm);

    if (filterBy === "all") return matchesSearch;
    if (filterBy === "with_barcode") return matchesSearch && session.barcode_value;
    if (filterBy === "high_risk") return matchesSearch && session.extractions?.risk_flags?.length > 0;
    if (filterBy === "recent") return matchesSearch && new Date(session.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (filterBy === "saved") return matchesSearch && bookmarkedSessions.has(session.id);
    if (filterBy === "unknown") return matchesSearch && (!session.products?.brand_name || session.products?.brand_name === "Unknown Medication");
    
    return matchesSearch;
  });

  // Group sessions by date for timeline display
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const date = format(new Date(session.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, ScanSession[]>);

  const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const content = (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-xl animate-float" />
        
        <div className="relative px-4 pt-6 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-sm border border-primary/20 shadow-soft">
              <History className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Scan Timeline
              </h1>
              <p className="text-sm text-muted-foreground">Your medication scanning history</p>
            </div>
            <Badge 
              variant="outline" 
              className="px-3 py-1 text-xs bg-primary/10 text-primary border-primary/30"
            >
              {filteredSessions.length} scan{filteredSessions.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-500/10 to-green-400/5 p-3 rounded-xl border border-green-500/20">
              <div className="text-lg font-bold text-green-700">
                {sessions.filter(s => s.products?.brand_name && s.products.brand_name !== "Unknown Medication").length}
              </div>
              <div className="text-xs text-green-600">Identified</div>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-400/5 p-3 rounded-xl border border-amber-500/20">
              <div className="text-lg font-bold text-amber-700">
                {sessions.filter(s => s.extractions?.risk_flags?.length > 0).length}
              </div>
              <div className="text-xs text-amber-600">Alerts</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-400/5 p-3 rounded-xl border border-purple-500/20">
              <div className="text-lg font-bold text-purple-700">{bookmarkedSessions.size}</div>
              <div className="text-xs text-purple-600">Saved</div>
            </div>
          </div>

          {/* Search and filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 backdrop-blur-sm border-border/50"
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="bg-background/50 backdrop-blur-sm border-border/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scans</SelectItem>
                <SelectItem value="recent">Last 7 Days</SelectItem>
                <SelectItem value="saved">Saved Items</SelectItem>
                <SelectItem value="high_risk">High Risk</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
                <SelectItem value="with_barcode">With Barcode</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div className="relative">
        <PullToRefreshWrapper onRefresh={handleRefresh} disabled={refreshing}>
          <div className="px-4 py-6">
            {loading ? (
              <TimelineLoadingSkeleton />
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                  <History className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm || filterBy !== "all" ? "No Matching Scans" : "No Scans Yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterBy !== "all" 
                    ? "Try adjusting your search or filter criteria."
                    : "Start scanning medications to build your timeline."
                  }
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map((date, dateIndex) => (
                  <div key={date} className="space-y-4">
                    {/* Date header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">
                          {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {groupedSessions[date].length} scan{groupedSessions[date].length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Timeline items for this date */}
                    <div className="space-y-0">
                      {groupedSessions[date].map((session, sessionIndex, array) => (
                        <TimelineScanCard
                          key={session.id}
                          session={session}
                          isBookmarked={bookmarkedSessions.has(session.id)}
                          onView={handleViewSession}
                          onBookmark={handleBookmark}
                          onDelete={handleDeleteConfirm}
                          onExport={exportSession}
                          isLast={dateIndex === sortedDates.length - 1 && sessionIndex === array.length - 1}
                          deletingSessionId={deletingSessionId}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PullToRefreshWrapper>
      </div>
    </div>
  );

  return (
    <ProfessionalMobileLayout title={t('history.title')} showHeader={true}>
      {content}
      
      {/* Session Details Bottom Sheet */}
      <BottomSheet 
        isOpen={showSessionDialog} 
        onClose={() => setShowSessionDialog(false)}
        title="Scan Details"
        subtitle="Detailed information about this medication scan"
        height="xl"
      >
        {selectedSession && (
          <div className="space-y-4 p-4">
            {/* Medication Info */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">
                {selectedSession.products?.brand_name || selectedSession.extractions?.extracted_json?.brand_name || "Unknown Medication"}
              </h3>
              {(selectedSession.products?.generic_name || selectedSession.extractions?.extracted_json?.generic_name) && (
                <p className="text-sm text-muted-foreground mb-2">
                  Generic: {selectedSession.products?.generic_name || selectedSession.extractions?.extracted_json?.generic_name}
                </p>
              )}
              {(selectedSession.products?.strength || selectedSession.extractions?.extracted_json?.strength) && (
                <p className="text-sm text-muted-foreground mb-2">
                  Strength: {selectedSession.products?.strength || selectedSession.extractions?.extracted_json?.strength}
                </p>
              )}
              {(selectedSession.products?.form || selectedSession.extractions?.extracted_json?.form) && (
                <p className="text-sm text-muted-foreground">
                  Form: {selectedSession.products?.form || selectedSession.extractions?.extracted_json?.form}
                </p>
              )}
            </div>

            {/* Scan Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Scan Date:</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedSession.created_at), 'MMM d, yyyy • h:mm a')}
                </span>
              </div>
              
              {selectedSession.extractions?.quality_score && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quality Score:</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      selectedSession.extractions.quality_score >= 0.8 && "bg-green-50 text-green-700 border-green-300",
                      selectedSession.extractions.quality_score >= 0.6 && selectedSession.extractions.quality_score < 0.8 && "bg-amber-50 text-amber-700 border-amber-300",
                      selectedSession.extractions.quality_score < 0.6 && "bg-red-50 text-red-700 border-red-300"
                    )}
                  >
                    {Math.round(selectedSession.extractions.quality_score * 100)}%
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Language:</span>
                <span className="text-sm text-muted-foreground uppercase">
                  {selectedSession.language}
                </span>
              </div>
            </div>

            {/* Risk Flags */}
            {selectedSession.extractions?.risk_flags && selectedSession.extractions.risk_flags.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Safety Alerts
                </h4>
                <div className="space-y-2">
                  {selectedSession.extractions.risk_flags.map((flag, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-red-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportSession(selectedSession)}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBookmark(selectedSession.id)}
                className="flex-1"
              >
                <Star className={cn("w-4 h-4 mr-2", bookmarkedSessions.has(selectedSession.id) && "fill-current text-purple-600")} />
                {bookmarkedSessions.has(selectedSession.id) ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Delete Confirmation - Mobile/Desktop */}
      {isMobile ? (
        <BottomSheet
          isOpen={!!sessionToDelete}
          onClose={handleCancelDelete}
          title="Delete Scan"
          height="md"
          dismissible={!deletingSessionId}
        >
          <div className="p-4">
            <div className="text-center mb-4">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
              <p className="text-muted-foreground text-sm">
                <TranslatedText translationKey="history.deleteConfirmation" />
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!!deletingSessionId}
                className="w-full"
                size="lg"
              >
                {deletingSessionId ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <TranslatedText translationKey="history.deleting" />
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    <TranslatedText translationKey="common.delete" />
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                disabled={!!deletingSessionId}
                className="w-full"
                size="lg"
              >
                <TranslatedText translationKey="common.cancel" />
              </Button>
            </div>
          </div>
        </BottomSheet>
      ) : (
        <Dialog open={!!sessionToDelete} onOpenChange={handleCancelDelete}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <TranslatedText translationKey="history.deleteScan" />
              </DialogTitle>
              <DialogDescription>
                <TranslatedText translationKey="history.deleteConfirmation" />
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                disabled={!!deletingSessionId}
                className="flex-1"
              >
                <TranslatedText translationKey="common.cancel" />
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!!deletingSessionId}
                className="flex-1"
              >
                {deletingSessionId ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    <TranslatedText translationKey="history.deleting" />
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    <TranslatedText translationKey="common.delete" />
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ProfessionalMobileLayout>
  );
};
