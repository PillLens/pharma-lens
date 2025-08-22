import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Search, Filter, Download, Trash2, Eye, RefreshCw, Archive, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileCard } from "@/components/ui/mobile/MobileCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import ProfessionalMobileLayout from "@/components/mobile/ProfessionalMobileLayout";
import ScanHistoryCard from "@/components/mobile/ScanHistoryCard";
import ScanHistorySkeleton from "@/components/mobile/ScanHistorySkeleton";
import PullToRefreshWrapper from "@/components/mobile/PullToRefreshWrapper";

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

export const ScanHistory = () => {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [bookmarkedSessions, setBookmarkedSessions] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
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
      
      // Simulate haptic feedback on successful refresh
      if (showRefreshing && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Error fetching scan history:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load scan history. Please try again.",
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
        title: "Removed from Saved",
        description: "Scan removed from your saved items.",
      });
    } else {
      newBookmarked.add(sessionId);
      toast({
        title: "Saved Successfully",
        description: "Scan added to your saved items.",
      });
    }
    setBookmarkedSessions(newBookmarked);
  };

  const handleDelete = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSessions(sessions.filter(s => s.id !== sessionId));
      const newBookmarked = new Set(bookmarkedSessions);
      newBookmarked.delete(sessionId);
      setBookmarkedSessions(newBookmarked);
      
      toast({
        title: "Deleted Successfully",
        description: "Scan has been permanently deleted.",
      });
      
      // Haptic feedback for delete
      if (navigator.vibrate) {
        navigator.vibrate([50, 50]);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete scan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArchive = (sessionId: string) => {
    // For now, just bookmark the item as "archived"
    handleBookmark(sessionId);
    toast({
      title: "Archived",
      description: "Scan moved to your archived items.",
    });
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

  const handleViewSession = (session: ScanSession) => {
    // Navigate to detailed view or show modal
    console.log('View session:', session);
  };

  const getQualityBadge = (score: number) => {
    if (score >= 0.8) return { variant: "default" as const, label: "High Quality", className: "bg-success text-success-foreground" };
    if (score >= 0.6) return { variant: "secondary" as const, label: "Medium Quality", className: "bg-warning text-warning-foreground" };
    return { variant: "destructive" as const, label: "Low Quality" };
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

  if (loading) {
    const loadingContent = (
      <div className="min-h-screen bg-gradient-surface">
        {!isMobile && (
          <header className="px-4 py-6 bg-background border-b border-border">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Button variant="ghost" size="icon" disabled>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <div className="w-32 h-6 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="w-48 h-4 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 h-10 bg-muted rounded animate-pulse"></div>
                <div className="w-48 h-10 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
          </header>
        )}
        
        {isMobile && (
          <div className="px-4 py-4 bg-background border-b border-border">
            <div className="w-16 h-5 bg-muted rounded animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        )}
        
        <main className={`px-4 py-8 ${!isMobile ? 'max-w-4xl mx-auto' : ''}`}>
          <ScanHistorySkeleton count={8} />
        </main>
      </div>
    );

    if (isMobile) {
      return (
        <ProfessionalMobileLayout title="Scan History" showHeader={false}>
          {loadingContent}
        </ProfessionalMobileLayout>
      );
    }
    
    return loadingContent;
  }

  const content = (
    <div className="min-h-screen bg-background">
      {/* Header - Only show on desktop */}
      {!isMobile && (
        <header className="px-4 py-6 bg-background border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Scan History</h1>
                  <p className="text-muted-foreground">Your recent medication scans</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {filteredSessions.length} scans
              </Badge>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by medication name or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-48">
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
        </header>
      )}

      {/* Mobile Search and Filter */}
      {isMobile && (
        <div className="px-4 py-4 bg-background border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="text-xs">
              {filteredSessions.length} scans
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger>
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
      )}

      {/* Main Content */}
      <main className={`${!isMobile ? 'max-w-4xl mx-auto' : ''}`}>
        <PullToRefreshWrapper
          onRefresh={handleRefresh}
          disabled={refreshing}
          className="min-h-screen"
        >
          <div className="px-4 py-8">
            {filteredSessions.length === 0 ? (
              <MobileCard className="p-12 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {loading ? "Loading..." : "No Scans Found"}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterBy !== "all" 
                    ? "Try adjusting your search or filter criteria."
                    : "Start scanning medications to see your history here."
                  }
                </p>
                {!loading && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="mt-4"
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                )}
              </MobileCard>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <ScanHistoryCard
                    key={session.id}
                    session={session}
                    onView={handleViewSession}
                    onExport={exportSession}
                    onBookmark={handleBookmark}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
                    isBookmarked={bookmarkedSessions.has(session.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </PullToRefreshWrapper>
      </main>
    </div>
  );

  if (isMobile) {
    return (
      <ProfessionalMobileLayout title="Scan History" showHeader={false}>
        {content}
      </ProfessionalMobileLayout>
    );
  }

  return content;
};