import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, User, Phone, Stethoscope, AlertCircle, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import { format, isToday, isTomorrow, isThisWeek, isPast } from 'date-fns';

interface Appointment {
  id: string;
  family_group_id: string;
  patient_id: string;
  created_by: string;
  title: string;
  description?: string;
  appointment_type: string;
  appointment_date: string;
  duration_minutes: number;
  provider_name?: string;
  provider_contact?: string;
  location?: string;
  status: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  patient?: any;
  creator?: any;
}

interface AppointmentManagerProps {
  familyGroupId: string;
  familyMembers: any[];
}

const AppointmentManager: React.FC<AppointmentManagerProps> = ({
  familyGroupId,
  familyMembers
}) => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAppointment, setShowCreateAppointment] = useState(false);

  // Appointment form state
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    description: '',
    appointmentType: 'medical',
    patientId: '',
    appointmentDate: '',
    appointmentTime: '',
    durationMinutes: 60,
    providerName: '',
    providerContact: '',
    location: ''
  });

  useEffect(() => {
    loadAppointments();
  }, [familyGroupId]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_appointments')
        .select(`
          *,
          patient:profiles!family_appointments_patient_id_fkey(display_name, email, avatar_url),
          creator:profiles!family_appointments_created_by_fkey(display_name, email, avatar_url)
        `)
        .eq('family_group_id', familyGroupId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments((data || []) as unknown as Appointment[]);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!appointmentForm.title || !appointmentForm.patientId || !appointmentForm.appointmentDate) {
      toast({
        title: t('common.error'),
        description: 'Please fill in required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const appointmentDateTime = `${appointmentForm.appointmentDate}T${appointmentForm.appointmentTime || '09:00'}`;

      const { data, error } = await supabase
        .from('family_appointments')
        .insert({
          family_group_id: familyGroupId,
          patient_id: appointmentForm.patientId,
          created_by: user.id,
          title: appointmentForm.title,
          description: appointmentForm.description,
          appointment_type: appointmentForm.appointmentType,
          appointment_date: appointmentDateTime,
          duration_minutes: appointmentForm.durationMinutes,
          provider_name: appointmentForm.providerName,
          provider_contact: appointmentForm.providerContact,
          location: appointmentForm.location,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      await loadAppointments();
      setShowCreateAppointment(false);
      resetForm();
      
      toast({
        title: 'Appointment Created',
        description: 'Appointment has been scheduled successfully',
      });

      // Send notification to patient if different from creator
      if (appointmentForm.patientId !== user.id) {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: appointmentForm.patientId,
            title: '📅 New Appointment Scheduled',
            body: `${appointmentForm.title} on ${format(new Date(appointmentDateTime), 'MMM dd, yyyy')}`,
            data: {
              type: 'appointment_scheduled',
              appointment_id: data.id,
              family_group_id: familyGroupId
            }
          }
        });
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to create appointment',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('family_appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      await loadAppointments();
      toast({
        title: 'Appointment Updated',
        description: `Appointment marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to update appointment',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setAppointmentForm({
      title: '',
      description: '',
      appointmentType: 'medical',
      patientId: '',
      appointmentDate: '',
      appointmentTime: '',
      durationMinutes: 60,
      providerName: '',
      providerContact: '',
      location: ''
    });
  };

  const getAppointmentDateLabel = (date: string) => {
    const appointmentDate = new Date(date);
    if (isToday(appointmentDate)) return 'Today';
    if (isTomorrow(appointmentDate)) return 'Tomorrow';
    if (isThisWeek(appointmentDate)) return format(appointmentDate, 'EEEE');
    return format(appointmentDate, 'MMM dd, yyyy');
  };

  const getStatusColor = (status: string, appointmentDate: string) => {
    const date = new Date(appointmentDate);
    if (isPast(date) && status === 'scheduled') {
      return 'bg-warning/10 text-warning border-warning/20';
    }
    switch (status) {
      case 'scheduled':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'cancelled':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      case 'missed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return <Stethoscope className="w-4 h-4" />;
      case 'dental':
        return <Calendar className="w-4 h-4" />;
      case 'specialist':
        return <User className="w-4 h-4" />;
      case 'therapy':
        return <Heart className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getMemberName = (userId: string) => {
    const member = familyMembers.find(m => m.user_id === userId);
    return member?.profiles?.display_name || member?.email || 'Unknown';
  };

  // Group appointments by date
  const groupedAppointments = appointments.reduce((groups, appointment) => {
    const dateKey = format(new Date(appointment.appointment_date), 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(appointment);
    return groups;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('family.appointments.title')}</h3>
          <Badge variant="secondary">{appointments.length}</Badge>
        </div>
        
        <Sheet open={showCreateAppointment} onOpenChange={setShowCreateAppointment}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Schedule New Appointment</SheetTitle>
              <SheetDescription>
                Create a new medical appointment for a family member
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 mt-6">
              <div>
                <Label htmlFor="title">Appointment Title *</Label>
                <Input
                  id="title"
                  value={appointmentForm.title}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Annual Checkup, Dentist Visit"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={appointmentForm.description}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about the appointment..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Appointment Type</Label>
                  <Select
                    value={appointmentForm.appointmentType}
                    onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, appointmentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="dental">Dental</SelectItem>
                      <SelectItem value="specialist">Specialist</SelectItem>
                      <SelectItem value="therapy">Therapy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Patient *</Label>
                  <Select
                    value={appointmentForm.patientId}
                    onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, patientId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.profiles?.display_name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="appointmentDate">Date *</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={appointmentForm.appointmentDate}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointmentDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="appointmentTime">Time</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={appointmentForm.appointmentTime}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointmentTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  value={appointmentForm.durationMinutes.toString()}
                  onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, durationMinutes: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="providerName">Healthcare Provider</Label>
                <Input
                  id="providerName"
                  value={appointmentForm.providerName}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, providerName: e.target.value }))}
                  placeholder="Dr. Smith, City Hospital"
                />
              </div>

              <div>
                <Label htmlFor="providerContact">Provider Contact</Label>
                <Input
                  id="providerContact"
                  value={appointmentForm.providerContact}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, providerContact: e.target.value }))}
                  placeholder="Phone number or email"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={appointmentForm.location}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Clinic address or online"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateAppointment} className="flex-1">
                  Schedule Appointment
                </Button>
                <Button variant="outline" onClick={() => setShowCreateAppointment(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : Object.keys(groupedAppointments).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No appointments scheduled</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateAppointment(true)}
              >
                Schedule your first appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.keys(groupedAppointments)
            .sort()
            .map((dateKey) => (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium text-sm">
                    {getAppointmentDateLabel(groupedAppointments[dateKey][0].appointment_date)}
                  </h4>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <div className="space-y-2">
                  {groupedAppointments[dateKey].map((appointment) => (
                    <Card key={appointment.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(appointment.appointment_type)}
                              <h4 className="font-medium">{appointment.title}</h4>
                              <Badge className={getStatusColor(appointment.status, appointment.appointment_date)}>
                                {appointment.status}
                              </Badge>
                              {isPast(new Date(appointment.appointment_date)) && appointment.status === 'scheduled' && (
                                <Badge variant="outline" className="text-warning">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                            
                            {appointment.description && (
                              <p className="text-sm text-muted-foreground mb-2">{appointment.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {getMemberName(appointment.patient_id)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(appointment.appointment_date), 'HH:mm')} ({appointment.duration_minutes}min)
                              </div>
                              {appointment.provider_name && (
                                <div className="flex items-center gap-1">
                                  <Stethoscope className="w-3 h-3" />
                                  {appointment.provider_name}
                                </div>
                              )}
                              {appointment.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {appointment.location}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 ml-4">
                            {appointment.status === 'scheduled' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                                  className="h-7 px-2"
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                                  className="h-7 px-2"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {appointment.provider_contact && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2"
                                onClick={() => window.open(`tel:${appointment.provider_contact}`, '_self')}
                              >
                                <Phone className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default AppointmentManager;