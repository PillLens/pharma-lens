import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, TrendingUp, Award } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { useTranslation } from '@/hooks/useTranslation';

export function GoalsCard() {
  const { goals, loading } = useGoals();
  const { t } = useTranslation();

  const activeGoals = goals.filter(g => g.is_active && !g.achieved_at);
  const achievedGoals = goals.filter(g => g.achieved_at);

  const getGoalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      adherence_rate: 'Adherence Rate',
      streak: 'Daily Streak',
      refill_on_time: 'Timely Refills',
      daily_completion: 'Daily Completion'
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Medication Goals</CardTitle>
          </div>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </div>
        <CardDescription>Track your medication adherence targets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-4">Loading goals...</div>
        ) : activeGoals.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active goals yet</p>
            <p className="text-sm mt-2">Set goals to track your progress</p>
          </div>
        ) : (
          <>
            {activeGoals.map(goal => {
              const progress = (goal.current_value / goal.target_value) * 100;
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{getGoalTypeLabel(goal.goal_type)}</span>
                      <Badge variant="outline" className="text-xs">
                        {goal.current_value} / {goal.target_value}
                        {goal.goal_type === 'adherence_rate' ? '%' : ''}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            })}

            {achievedGoals.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <h4 className="text-sm font-medium">Recent Achievements</h4>
                </div>
                <div className="space-y-2">
                  {achievedGoals.slice(0, 3).map(goal => (
                    <div key={goal.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {getGoalTypeLabel(goal.goal_type)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        ✓ Achieved
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
