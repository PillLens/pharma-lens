import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Heart, TrendingUp, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { familySharingService, FamilyGroup, SharedMedication } from '@/services/familySharingService';

interface FamilyHealthMonitorProps {
  familyGroups: FamilyGroup[];
  onEmergencyAlert: (groupId: string, message: string) => void;
}

interface HealthMetrics {
  adherenceRate: number;
  activeAlerts: number;
  missedDoses: number;
  onTimeRate: number;
  lastActivity: string;
}

interface FamilyMemberHealth {
  memberId: string;
  memberName: string;
  metrics: HealthMetrics;
  status: 'good' | 'warning' | 'critical';
  medications: SharedMedication[];
}

export const FamilyHealthMonitor: React.FC<FamilyHealthMonitorProps> = ({
  familyGroups,
  onEmergencyAlert
}) => {
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [memberHealthData, setMemberHealthData] = useState<FamilyMemberHealth[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (familyGroups.length > 0) {
      setSelectedGroup(familyGroups[0]);
    }
  }, [familyGroups]);

  useEffect(() => {
    if (selectedGroup) {
      loadHealthData();
    }
  }, [selectedGroup]);

  const loadHealthData = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      // Get shared medications for the group
      const sharedMedications = await familySharingService.getSharedMedications(selectedGroup.id);
      
      // Generate mock health data for demonstration
      // In a real app, this would come from actual medication tracking data
      const mockHealthData: FamilyMemberHealth[] = selectedGroup.members?.map(member => ({
        memberId: member.user_id,
        memberName: member.display_name || member.user_email || 'Unknown Member',
        metrics: generateMockMetrics(),
        status: generateHealthStatus(),
        medications: sharedMedications.filter(med => Math.random() > 0.5) // Random assignment for demo
      })) || [];

      setMemberHealthData(mockHealthData);
    } catch (error) {
      console.error('Error loading health data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load health monitoring data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockMetrics = (): HealthMetrics => ({
    adherenceRate: Math.round(75 + Math.random() * 25), // 75-100%
    activeAlerts: Math.floor(Math.random() * 3),
    missedDoses: Math.floor(Math.random() * 5),
    onTimeRate: Math.round(80 + Math.random() * 20), // 80-100%
    lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
  });

  const generateHealthStatus = (): 'good' | 'warning' | 'critical' => {
    const rand = Math.random();
    if (rand < 0.7) return 'good';
    if (rand < 0.9) return 'warning';
    return 'critical';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <Heart className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const handleEmergencyAlert = (member: FamilyMemberHealth) => {
    const message = `Emergency alert for ${member.memberName}: Critical health status detected`;
    onEmergencyAlert(selectedGroup?.id || '', message);
    toast({
      title: 'Emergency Alert Sent',
      description: `Emergency contacts have been notified about ${member.memberName}`,
    });
  };

  const calculateGroupMetrics = () => {
    if (memberHealthData.length === 0) return null;

    const averageAdherence = Math.round(
      memberHealthData.reduce((sum, member) => sum + member.metrics.adherenceRate, 0) / memberHealthData.length
    );

    const totalAlerts = memberHealthData.reduce((sum, member) => sum + member.metrics.activeAlerts, 0);
    const criticalMembers = memberHealthData.filter(member => member.status === 'critical').length;

    return {
      averageAdherence,
      totalAlerts,
      criticalMembers,
      totalMembers: memberHealthData.length
    };
  };

  const groupMetrics = calculateGroupMetrics();

  if (familyGroups.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Create a family group to start monitoring health metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Monitor Group:</label>
        <select 
          value={selectedGroup?.id || ''} 
          onChange={(e) => {
            const group = familyGroups.find(g => g.id === e.target.value);
            setSelectedGroup(group || null);
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {familyGroups.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Group Overview Metrics */}
      {groupMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Group Adherence</p>
                  <p className="text-2xl font-bold">{groupMetrics.averageAdherence}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <Progress value={groupMetrics.averageAdherence} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold">{groupMetrics.totalAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Status</p>
                  <p className="text-2xl font-bold">{groupMetrics.criticalMembers}</p>
                </div>
                <Heart className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{groupMetrics.totalMembers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Member Health Details */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Member Details</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                      <div className="h-2 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              memberHealthData.map(member => (
                <Card key={member.memberId} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{member.memberName}</CardTitle>
                      <Badge className={getStatusColor(member.status)}>
                        {getStatusIcon(member.status)}
                        <span className="ml-1 capitalize">{member.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Adherence Rate</span>
                        <span className="font-medium">{member.metrics.adherenceRate}%</span>
                      </div>
                      <Progress value={member.metrics.adherenceRate} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Missed Doses</p>
                        <p className="font-medium">{member.metrics.missedDoses}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">On Time</p>
                        <p className="font-medium">{member.metrics.onTimeRate}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Last activity: {new Date(member.metrics.lastActivity).toLocaleString()}</span>
                    </div>

                    {member.status === 'critical' && (
                      <Button 
                        onClick={() => handleEmergencyAlert(member)}
                        size="sm" 
                        variant="destructive" 
                        className="w-full"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Send Emergency Alert
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {memberHealthData.map(member => (
            <Card key={member.memberId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{member.memberName}</CardTitle>
                  <Badge className={getStatusColor(member.status)}>
                    {getStatusIcon(member.status)}
                    <span className="ml-1 capitalize">{member.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{member.metrics.adherenceRate}%</p>
                    <p className="text-sm text-muted-foreground">Adherence Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{member.metrics.onTimeRate}%</p>
                    <p className="text-sm text-muted-foreground">On Time Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{member.metrics.missedDoses}</p>
                    <p className="text-sm text-muted-foreground">Missed Doses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{member.metrics.activeAlerts}</p>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Shared Medications ({member.medications.length})</h4>
                  <div className="space-y-2">
                    {member.medications.map(medication => (
                      <div key={medication.id} className="p-2 border rounded text-sm">
                        <p className="font-medium">{medication.medication?.medication_name}</p>
                        <p className="text-muted-foreground">{medication.medication?.dosage} - {medication.medication?.frequency}</p>
                      </div>
                    ))}
                    {member.medications.length === 0 && (
                      <p className="text-sm text-muted-foreground">No shared medications</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {memberHealthData
              .filter(member => member.metrics.activeAlerts > 0)
              .map(member => (
                <Card key={member.memberId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      {member.memberName} - {member.metrics.activeAlerts} Alert(s)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.from({ length: member.metrics.activeAlerts }).map((_, i) => (
                        <div key={i} className="p-3 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/10">
                          <p className="font-medium">Missed Medication Reminder</p>
                          <p className="text-sm text-muted-foreground">
                            Expected dose not taken at scheduled time
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

            {memberHealthData.filter(member => member.metrics.activeAlerts > 0).length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No active alerts. Everyone is doing well!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FamilyHealthMonitor;