import React from 'react';
import { Heart, Shield, Activity, Users, Clock, Zap, TrendingUp, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';

interface EnhancedFamilyDashboardProps {
  familyGroups: any[];
  onEmergencyCall?: () => void;
  onQuickAction?: (action: string) => void;
}

const EnhancedFamilyDashboard: React.FC<EnhancedFamilyDashboardProps> = ({
  familyGroups,
  onEmergencyCall,
  onQuickAction
}) => {
  const { t } = useTranslation();

  // Mock data for demonstration
  const adherenceData = [
    { day: 'Mon', adherence: 95 },
    { day: 'Tue', adherence: 87 },
    { day: 'Wed', adherence: 92 },
    { day: 'Thu', adherence: 98 },
    { day: 'Fri', adherence: 85 },
    { day: 'Sat', adherence: 90 },
    { day: 'Sun', adherence: 94 }
  ];

  const medicationDistribution = [
    { name: 'On Time', value: 78, color: 'hsl(var(--success))' },
    { name: 'Delayed', value: 15, color: 'hsl(var(--warning))' },
    { name: 'Missed', value: 7, color: 'hsl(var(--destructive))' }
  ];

  const totalMembers = familyGroups.reduce((sum, group) => sum + (group.members?.length || 0), 0);
  const activeMembers = familyGroups.reduce((sum, group) => 
    sum + (group.members?.filter(m => m.invitation_status === 'accepted').length || 0), 0);
  const overallAdherence = 91;
  const pendingTasks = 3;

  return (
    <div className="space-y-6">
      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Family Members</p>
                <p className="text-2xl font-bold text-primary">{activeMembers}</p>
                <p className="text-xs text-muted-foreground">of {totalMembers} total</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Adherence Rate</p>
                <p className="text-2xl font-bold text-success">{overallAdherence}%</p>
                <p className="text-xs text-success">+2% this week</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Tasks</p>
                <p className="text-2xl font-bold text-warning">{pendingTasks}</p>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Care Score</p>
                <p className="text-2xl font-bold text-blue-600">A+</p>
                <p className="text-xs text-blue-600">Excellent care</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-destructive/20 bg-gradient-to-r from-destructive/5 to-red-500/10 hover:shadow-lg transition-all cursor-pointer" onClick={onEmergencyCall}>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
              <Phone className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="font-semibold text-destructive mb-1">Emergency Contact</h3>
            <p className="text-xs text-muted-foreground">One-touch emergency call</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-lg transition-all cursor-pointer" onClick={() => onQuickAction?.('medications')}>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-primary mb-1">Share Medications</h3>
            <p className="text-xs text-muted-foreground">Quick medication sharing</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-blue-500/10 hover:shadow-lg transition-all cursor-pointer" onClick={() => onQuickAction?.('checkup')}>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-600 mb-1">Daily Check-up</h3>
            <p className="text-xs text-muted-foreground">Start family wellness check</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Adherence Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Weekly Adherence Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={adherenceData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs" />
                  <YAxis hide />
                  <Line 
                    type="monotone" 
                    dataKey="adherence" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>Average: 91.6%</span>
              <Badge className="bg-success/10 text-success">+2.3% improvement</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Medication Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Medication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medicationDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    dataKey="value"
                  >
                    {medicationDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {medicationDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Recent Family Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium">Sarah took her morning medication</p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
              <Badge className="bg-success/10 text-success">On Time</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium">John's evening dose is due in 30 minutes</p>
                <p className="text-xs text-muted-foreground">Reminder set</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                Notify
              </Button>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium">New medication shared by Dr. Smith</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <Badge className="bg-blue-500/10 text-blue-600">New</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedFamilyDashboard;