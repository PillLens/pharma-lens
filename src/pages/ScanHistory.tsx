import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Search, Filter, Download, Trash2, Eye } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const fetchScanHistory = async () => {
    if (!user) return;

    try {
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
    } catch (error) {
      console.error('Error fetching scan history:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load scan history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    
    return matchesSearch;
  });

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
      <div className="min-h-screen bg-background">
        <header className={`px-4 py-6 bg-background border-b border-border ${isMobile ? '' : ''}`}>
          <div className={!isMobile ? 'max-w-4xl mx-auto' : ''}>
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
          </div>
        </header>
        <main className={`px-4 py-8 ${!isMobile ? 'max-w-4xl mx-auto' : ''}`}>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <MobileCard key={i} className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </MobileCard>
            ))}
          </div>
        </main>
      </div>
    );

    if (isMobile) {
      return (
        <ProfessionalMobileLayout title="Scan History">
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
                  <SelectItem value="with_barcode">With Barcode</SelectItem>
                  <SelectItem value="high_risk">High Risk</SelectItem>
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
                <SelectItem value="with_barcode">With Barcode</SelectItem>
                <SelectItem value="high_risk">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`px-4 py-8 ${!isMobile ? 'max-w-4xl mx-auto' : ''}`}>
        {filteredSessions.length === 0 ? (
          <MobileCard className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Scans Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterBy !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Start scanning medications to see your history here."
              }
            </p>
          </MobileCard>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              const medication = session.products || session.extractions?.extracted_json;
              const qualityScore = session.extractions?.quality_score || 0;
              const riskFlags = session.extractions?.risk_flags || [];

              return (
                <MobileCard key={session.id} variant="elevated" className="p-4 hover:shadow-card transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-base">
                        {medication?.brand_name || "Unknown Medication"}
                      </h3>
                      {medication?.generic_name && (
                        <p className="text-sm text-muted-foreground">
                          {medication.generic_name}
                          {medication.strength && ` • ${medication.strength}`}
                          {medication.form && ` • ${medication.form}`}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}</span>
                        {session.barcode_value && !isMobile && (
                          <>
                            <span>•</span>
                            <span>Barcode: {session.barcode_value}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {qualityScore > 0 && (
                        <Badge {...getQualityBadge(qualityScore)} className="text-xs">
                          {Math.round(qualityScore * 100)}%
                        </Badge>
                      )}
                      {riskFlags.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {riskFlags.length} Risk{riskFlags.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {riskFlags.length > 0 && (
                    <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <h4 className="text-sm font-medium text-destructive mb-1">Risk Flags:</h4>
                      <ul className="text-sm text-destructive space-y-1">
                        {riskFlags.map((flag, index) => (
                          <li key={index}>• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => exportSession(session)}
                      className="text-xs h-8"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  </div>
                </MobileCard>
              );
            })}
          </div>
        )}
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