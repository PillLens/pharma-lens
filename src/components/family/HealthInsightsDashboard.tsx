import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Heart, Brain, Activity, Shield, Bell, Info,
  Lightbulb, Target, Clock
} from 'lucide-react';
import { familyHealthInsightsService } from '@/services/familyHealthInsightsService';

interface HealthInsightsDashboardProps {
  familyGroups: any[];
  currentUserId: string;
}

interface HealthInsight {
  id: string;
  type: 'medication_adherence' | 'health_trend' | 'risk_assessment' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'safety' | 'adherence' | 'wellness' | 'family';
  actionable: boolean;
  confidence: number;
  created_at: string;
  expires_at?: string;
  metadata?: any;
  recommendations?: string[];
}

interface FamilyHealthScore {
  overall: number;
  adherence: number;
  safety: number;
  engagement: number;
  trends: {
    overall: 'improving' | 'stable' | 'declining';
    adherence: 'improving' | 'stable' | 'declining';
    safety: 'improving' | 'stable' | 'declining';
    engagement: 'improving' | 'stable' | 'declining';
  };
}

export const HealthInsightsDashboard: React.FC<HealthInsightsDashboardProps> = ({
  familyGroups,
  currentUserId
}) => {
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [healthScore, setHealthScore] = useState<FamilyHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'safety' | 'adherence' | 'wellness' | 'family'>('all');

  useEffect(() => {
    loadHealthInsights();
    loadFamilyHealthScore();
  }, [familyGroups]);

  const loadHealthInsights = async () => {
    if (!familyGroups?.length) return;

    try {
      const allInsights: HealthInsight[] = []; // Mock insights for now
      setInsights(allInsights);
    } catch (error) {
      console.error('Error loading health insights:', error);
      toast.error('Failed to load health insights');
    }
  };

  const loadFamilyHealthScore = async () => {
    if (!familyGroups?.length) return;

    try {
      setLoading(true);
      const score: FamilyHealthScore = { // Mock score for now
        overall: 85,
        adherence: 90,
        safety: 80,
        engagement: 85,
        trends: {
          overall: 'improving',
          adherence: 'stable',
          safety: 'improving',
          engagement: 'stable'
        }
      };
      setHealthScore(score);
    } catch (error) {
      console.error('Error loading family health score:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissInsight = async (insightId: string) => {
    try {
      setInsights(insights.filter(insight => insight.id !== insightId));
      toast.success('Insight dismissed');
    } catch (error) {
      console.error('Error dismissing insight:', error);
      toast.error('Failed to dismiss insight');
    }
  };

  const handleMarkAsActioned = async (insightId: string) => {
    try {
      setInsights(insights.map(insight => 
        insight.id === insightId 
          ? { ...insight, actionable: false }
          : insight
      ));
      toast.success('Marked as completed');
    } catch (error) {
      console.error('Error marking insight as actioned:', error);
      toast.error('Failed to update insight');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety': return Shield;
      case 'adherence': return Heart;
      case 'wellness': return Activity;
      case 'family': return Brain;
      default: return Info;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return TrendingUp;
      case 'declining': return TrendingDown;
      default: return Activity;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Family Health Score */}
      {healthScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Family Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{healthScore.overall}%</div>
                <p className="text-sm text-muted-foreground mb-2">Overall Health</p>
                <div className="flex items-center justify-center gap-1">
                  {React.createElement(getTrendIcon(healthScore.trends.overall), {
                    className: `h-4 w-4 ${getTrendColor(healthScore.trends.overall)}`
                  })}
                  <span className={`text-xs ${getTrendColor(healthScore.trends.overall)}`}>
                    {healthScore.trends.overall}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Adherence</span>
                    <span className="text-sm text-muted-foreground">{healthScore.adherence}%</span>
                  </div>
                  <Progress value={healthScore.adherence} className="h-2" />
                </div>
                <div className="flex items-center gap-1">
                  {React.createElement(getTrendIcon(healthScore.trends.adherence), {
                    className: `h-3 w-3 ${getTrendColor(healthScore.trends.adherence)}`
                  })}
                  <span className={`text-xs ${getTrendColor(healthScore.trends.adherence)}`}>
                    {healthScore.trends.adherence}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Safety</span>
                    <span className="text-sm text-muted-foreground">{healthScore.safety}%</span>
                  </div>
                  <Progress value={healthScore.safety} className="h-2" />
                </div>
                <div className="flex items-center gap-1">
                  {React.createElement(getTrendIcon(healthScore.trends.safety), {
                    className: `h-3 w-3 ${getTrendColor(healthScore.trends.safety)}`
                  })}
                  <span className={`text-xs ${getTrendColor(healthScore.trends.safety)}`}>
                    {healthScore.trends.safety}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Engagement</span>
                    <span className="text-sm text-muted-foreground">{healthScore.engagement}%</span>
                  </div>
                  <Progress value={healthScore.engagement} className="h-2" />
                </div>
                <div className="flex items-center gap-1">
                  {React.createElement(getTrendIcon(healthScore.trends.engagement), {
                    className: `h-3 w-3 ${getTrendColor(healthScore.trends.engagement)}`
                  })}
                  <span className={`text-xs ${getTrendColor(healthScore.trends.engagement)}`}>
                    {healthScore.trends.engagement}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'safety', 'adherence', 'wellness', 'family'].map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category as any)}
            className="capitalize"
          >
            {category === 'all' ? 'All Insights' : category}
          </Button>
        ))}
      </div>

      {/* Health Insights */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Health Insights</h3>
              <p className="text-muted-foreground">
                {selectedCategory === 'all' 
                  ? "We're analyzing your family's health data to provide personalized insights."
                  : `No ${selectedCategory} insights available at the moment.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInsights.map((insight) => {
            const CategoryIcon = getCategoryIcon(insight.category);
            return (
              <Card key={insight.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CategoryIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getPriorityColor(insight.priority) as any}>
                            {insight.priority}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {insight.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {insight.priority === 'critical' && (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{insight.description}</p>
                  
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(insight.created_at).toLocaleDateString()}
                      {insight.expires_at && (
                        <span>• Expires {new Date(insight.expires_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {insight.actionable && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsActioned(insight.id)}
                        >
                          Mark as Done
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDismissInsight(insight.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};