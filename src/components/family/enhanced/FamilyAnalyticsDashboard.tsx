import React, { useState } from 'react';
import { 
  TrendingUp, BarChart3, Users, Activity, Heart, Clock, 
  AlertTriangle, CheckCircle, Calendar, Download, Filter,
  Zap, Shield, Phone, MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  AreaChart, Area
} from 'recharts';
import { useTranslation } from '@/hooks/useTranslation';

interface FamilyAnalyticsDashboardProps {
  familyGroups: any[];
  onExportReport?: () => void;
  onContactProvider?: () => void;
}

const FamilyAnalyticsDashboard: React.FC<FamilyAnalyticsDashboardProps> = ({
  familyGroups,
  onExportReport,
  onContactProvider
}) => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock analytics data
  const adherenceData = [
    { date: '2024-01-01', sarah: 95, john: 87, family: 91 },
    { date: '2024-01-02', sarah: 92, john: 89, family: 90.5 },
    { date: '2024-01-03', sarah: 98, john: 85, family: 91.5 },
    { date: '2024-01-04', sarah: 88, john: 92, family: 90 },
    { date: '2024-01-05', sarah: 94, john: 88, family: 91 },
    { date: '2024-01-06', sarah: 96, john: 90, family: 93 },
    { date: '2024-01-07', sarah: 91, john: 87, family: 89 }
  ];

  const medicationStatusData = [
    { name: 'On Time', value: 78, color: 'hsl(var(--success))' },
    { name: 'Delayed', value: 15, color: 'hsl(var(--warning))' },
    { name: 'Missed', value: 7, color: 'hsl(var(--destructive))' }
  ];

  const memberPerformanceData = [
    { name: 'Sarah', adherence: 94, angle: 338.4 },
    { name: 'John', adherence: 88, angle: 316.8 },
    { name: 'Mom', adherence: 96, angle: 345.6 },
    { name: 'Dad', adherence: 85, angle: 306 }
  ];

  const weeklyTrendsData = [
    { week: 'Week 1', medications: 42, checkups: 3, appointments: 1 },
    { week: 'Week 2', medications: 45, checkups: 2, appointments: 2 },
    { week: 'Week 3', medications: 40, checkups: 4, appointments: 1 },
    { week: 'Week 4', medications: 47, checkups: 3, appointments: 3 }
  ];

  const healthMetrics = [
    { metric: 'Blood Pressure', sarah: 120, john: 135, normal: 120 },
    { metric: 'Heart Rate', sarah: 72, john: 78, normal: 70 },
    { metric: 'Weight', sarah: 65, john: 80, normal: 70 },
    { metric: 'Blood Sugar', sarah: 95, john: 110, normal: 100 }
  ];

  const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--primary))'];

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-foreground truncate">Family Analytics</h3>
          <p className="text-sm text-muted-foreground">Comprehensive family health insights</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-28 sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={onExportReport} className="flex-shrink-0">
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">Overall Adherence</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">91.2%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <p className="text-xs text-success truncate">+2.3% vs last week</p>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">Active Members</p>
                <p className="text-xl sm:text-2xl font-bold text-success">4</p>
                <p className="text-xs text-muted-foreground truncate">All participating</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">Health Score</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">A+</p>
                <p className="text-xs text-blue-600 truncate">Excellent progress</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground font-medium">Alerts</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">2</p>
                <p className="text-xs text-muted-foreground truncate">Require attention</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="adherence" className="text-xs sm:text-sm">Adherence</TabsTrigger>
              <TabsTrigger value="health" className="text-xs sm:text-sm">Health</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Medication Status Distribution */}
                <Card className="border-0 bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Medication Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 sm:h-40 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={medicationStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            dataKey="value"
                            label={({value}) => `${value}%`}
                          >
                            {medicationStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {medicationStatusData.map((item, index) => (
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

                {/* Member Performance */}
                <Card className="border-0 bg-muted/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Member Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 sm:h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={memberPerformanceData}>
                          <RadialBar dataKey="adherence" cornerRadius={10} fill="hsl(var(--primary))" />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {memberPerformanceData.map((member, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span>{member.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${member.adherence}%` }}
                              />
                            </div>
                            <span className="font-medium">{member.adherence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="adherence" className="space-y-6 mt-6">
              <Card className="border-0 bg-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Adherence Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={adherenceData}>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-xs" />
                        <YAxis hide />
                        <Area 
                          type="monotone" 
                          dataKey="sarah" 
                          stackId="1"
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="john" 
                          stackId="2"
                          stroke="hsl(var(--success))" 
                          fill="hsl(var(--success))"
                          fillOpacity={0.3}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="family" 
                          stroke="hsl(var(--warning))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--warning))', r: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span>Sarah</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span>John</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      <span>Family Average</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="space-y-6 mt-6">
              <Card className="border-0 bg-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" />
                    Health Metrics Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={healthMetrics}>
                        <XAxis dataKey="metric" className="text-xs" />
                        <YAxis />
                        <Bar dataKey="sarah" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="john" fill="hsl(var(--success))" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="normal" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6 mt-6">
              <Card className="border-0 bg-muted/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Weekly Activity Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyTrendsData}>
                        <XAxis dataKey="week" className="text-xs" />
                        <YAxis />
                        <Bar dataKey="medications" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="checkups" fill="hsl(var(--success))" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="appointments" fill="hsl(var(--warning))" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 hover:shadow-lg transition-all cursor-pointer" onClick={onContactProvider}>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
              <Phone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-primary mb-1">Contact Healthcare Provider</h3>
            <p className="text-xs text-muted-foreground">Share analytics with your doctor</p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-blue-500/10 hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-600 mb-1">Family Discussion</h3>
            <p className="text-xs text-muted-foreground">Discuss insights with family</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FamilyAnalyticsDashboard;