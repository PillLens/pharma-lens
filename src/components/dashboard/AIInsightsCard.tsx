import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, RefreshCw, AlertCircle, Info, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAIInsights } from '@/hooks/useAIInsights';
import { useNavigate } from 'react-router-dom';

export function AIInsightsCard() {
  const { insights, loading, dismissInsight, generateInsights } = useAIInsights();
  const navigate = useNavigate();

  const getPriorityColor = (priority: string): "default" | "destructive" | "outline" | "secondary" => {
    const colors: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      urgent: 'destructive',
      high: 'destructive',
      normal: 'default',
      low: 'secondary',
    };
    return colors[priority] || 'default';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'normal':
        return <Info className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Insights</CardTitle>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={generateInsights}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <CardDescription>Personalized recommendations for better health</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground py-4">Analyzing your data...</div>
        ) : insights.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No insights available yet</p>
            <p className="text-sm mt-2">Keep tracking your medications for personalized insights</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={generateInsights}
            >
              Generate Insights
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 3).map(insight => (
              <div
                key={insight.id}
                className="relative p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => dismissInsight(insight.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                <div className="flex items-start gap-3 pr-8">
                  <div className="mt-1">
                    {getPriorityIcon(insight.priority)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.description}
                    </p>
                    {insight.actionable && insight.action_url && (
                      <Button
                        size="sm"
                        variant="link"
                        className="h-auto p-0 text-xs"
                        onClick={() => navigate(insight.action_url!)}
                      >
                        Take action →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
