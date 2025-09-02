import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { realTimeFeaturesService } from '@/services/realTimeFeaturesService';
import { toast } from 'sonner';
import {
  TrendingUp, TrendingDown, AlertTriangle, Heart, 
  Pill, Users, Calendar, Activity, Lightbulb,
  CheckCircle, Clock, Target
} from 'lucide-react';

interface AdvancedFamilyInsightsProps {
  familyGroupId: string;
}

interface Insight {
  id: string;
  type: 'medication_adherence' | 'family_health' | 'emergency_preparedness' | 'wellness_trend';
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionable: boolean;
  recommendations: string[];
  data: any;
  expires_at?: string;
}

interface FamilyAnalytics {
  adherence_rate: number;
  missed_doses_week: number;
  active_members: number;
  emergency_contacts_count: number;
  recent_activities: any[];
  health_trends: any[];
}

export const AdvancedFamilyInsights: React.FC<AdvancedFamilyInsightsProps> = ({
  familyGroupId
}) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [analytics, setAnalytics] = useState<FamilyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    loadAnalytics();
    loadInsights();
  }, [familyGroupId]);

  const loadAnalytics = async () => {
    try {
      const familyAnalytics = await realTimeFeaturesService.getFamilyAnalytics(familyGroupId);
      setAnalytics(familyAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadInsights = async () => {
    try {
      setLoading(true);
      const familyInsights = await realTimeFeaturesService.generateFamilyInsights(familyGroupId);
      setInsights(familyInsights);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast.error('Failed to load family insights');
    } finally {
      setLoading(false);
    }
  };

  const generateNewInsights = async () => {
    try {
      setGeneratingInsights(true);
      const newInsights = await realTimeFeaturesService.generateFamilyInsights(familyGroupId);
      setInsights(newInsights);
      toast.success('New insights generated');
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate new insights');
    } finally {
      setGeneratingInsights(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'medication_adherence':
        return <Pill className="w-4 h-4" />;
      case 'family_health':
        return <Heart className="w-4 h-4" />;
      case 'emergency_preparedness':
        return <AlertTriangle className="w-4 h-4" />;
      case 'wellness_trend':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'normal':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdherenceStatus = (rate: number) => {
    if (rate >= 90) return 'Excellent';
    if (rate >= 70) return 'Good';
    if (rate >= 50) return 'Needs Attention';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Adherence Rate</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${getAdherenceColor(analytics.adherence_rate)}`}>
                      {analytics.adherence_rate}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getAdherenceStatus(analytics.adherence_rate)}
                    </span>
                  </div>
                  <Progress value={analytics.adherence_rate} className="mt-2 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium">Missed Doses</span>
                </div>
                <div>
                  <span className="text-2xl font-bold">{analytics.missed_doses_week}</span>
                  <p className="text-xs text-muted-foreground">This week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Active Members</span>
                </div>
                <div>
                  <span className="text-2xl font-bold">{analytics.active_members}</span>
                  <p className="text-xs text-muted-foreground">Family members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium">Emergency Contacts</span>
                </div>
                <div>
                  <span className="text-2xl font-bold">{analytics.emergency_contacts_count}</span>
                  <p className="text-xs text-muted-foreground">Contacts setup</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              AI Family Insights
            </div>
            <Button 
              onClick={generateNewInsights}
              disabled={generatingInsights}
              size="sm"
            >
              {generatingInsights ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Refresh Insights
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Insights List */}
      {insights.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No Insights Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your family is doing great! Check back later for new insights.
            </p>
            <Button onClick={generateNewInsights} disabled={generatingInsights}>
              Generate New Insights
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                          {insight.priority.toUpperCase()}
                        </Badge>
                        {insight.actionable && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Actionable
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {insight.description}
                </p>

                {insight.actionable && insight.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recommended Actions:</h4>
                    <ul className="space-y-1">
                      {insight.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insight.data && Object.keys(insight.data).length > 0 && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Additional Data:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(insight.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="font-medium">
                            {typeof value === 'number' ? value : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};