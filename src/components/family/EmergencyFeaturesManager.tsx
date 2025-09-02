import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Phone, Shield, AlertTriangle, MapPin, Clock, Users,
  Plus, Edit, Trash2, PhoneCall, MessageSquare, Navigation,
  Heart, Activity, Siren, CheckCircle, Bell, User
} from 'lucide-react';
import { emergencyFeaturesService } from '@/services/emergencyFeaturesService';

interface EmergencyFeaturesManagerProps {
  familyGroups: any[];
  currentUserId: string;
}

interface EmergencyContact {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority: number;
  is_active: boolean;
  user_id: string;
}

interface EmergencyProtocol {
  id: string;
  name: string;
  type: 'medical' | 'safety' | 'general';
  description: string;
  steps: string[];
  emergency_contacts: string[];
  family_group_id: string;
  is_active: boolean;
}

interface EmergencyAlert {
  id?: string;
  type: 'medical' | 'safety' | 'location' | 'general';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'cancelled';
  created_by: string;
  family_group_id: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  created_at?: string;
  resolved_at?: string;
}

export const EmergencyFeaturesManager: React.FC<EmergencyFeaturesManagerProps> = ({
  familyGroups,
  currentUserId
}) => {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyProtocols, setEmergencyProtocols] = useState<EmergencyProtocol[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<EmergencyProtocol | null>(null);

  // Form states
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    priority: 1
  });

  const [protocolForm, setProtocolForm] = useState({
    name: '',
    type: 'medical' as 'medical' | 'safety' | 'general',
    description: '',
    steps: [''],
    selectedContacts: [] as string[]
  });

  const [emergencyForm, setEmergencyForm] = useState({
    type: 'general' as 'medical' | 'safety' | 'location' | 'general',
    title: '',
    message: '',
    priority: 'high' as 'low' | 'medium' | 'high' | 'critical',
    selectedGroup: ''
  });

  useEffect(() => {
    loadEmergencyData();
  }, [familyGroups, currentUserId]);

  const loadEmergencyData = async () => {
    try {
      setLoading(true);
      
      const [contacts, protocols, alerts] = await Promise.all([
        emergencyFeaturesService.getEmergencyContacts(currentUserId),
        emergencyFeaturesService.getEmergencyProtocols(familyGroups),
        emergencyFeaturesService.getRecentEmergencyAlerts(familyGroups)
      ]);

      setEmergencyContacts(contacts);
      setEmergencyProtocols(protocols);
      setRecentAlerts(alerts);
    } catch (error) {
      console.error('Error loading emergency data:', error);
      toast.error('Failed to load emergency data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    try {
      if (selectedContact) {
        // Update existing contact
        await emergencyFeaturesService.updateEmergencyContact(selectedContact.id, {
          ...contactForm,
          is_active: true
        });
        toast.success('Emergency contact updated');
      } else {
        // Create new contact
        await emergencyFeaturesService.createEmergencyContact({
          ...contactForm,
          user_id: currentUserId,
          is_active: true
        });
        toast.success('Emergency contact created');
      }
      
      setContactDialogOpen(false);
      setSelectedContact(null);
      setContactForm({ name: '', phone: '', email: '', relationship: '', priority: 1 });
      loadEmergencyData();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    }
  };

  const handleSendEmergencyAlert = async () => {
    try {
      if (!emergencyForm.selectedGroup) {
        toast.error('Please select a family group');
        return;
      }

      await emergencyFeaturesService.sendEmergencyAlert({
        ...emergencyForm,
        family_group_id: emergencyForm.selectedGroup,
        created_by: currentUserId
      });

      toast.success('Emergency alert sent to family members');
      setEmergencyDialogOpen(false);
      setEmergencyForm({
        type: 'general',
        title: '',
        message: '',
        priority: 'high',
        selectedGroup: ''
      });
      loadEmergencyData();
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      toast.error('Failed to send emergency alert');
    }
  };

  const handleOneClickEmergency = async (type: 'medical' | 'police' | 'fire') => {
    try {
      const alertConfig = {
        medical: {
          title: 'Medical Emergency',
          message: 'Medical assistance needed immediately',
          priority: 'critical' as const
        },
        police: {
          title: 'Safety Emergency',
          message: 'Police assistance needed',
          priority: 'critical' as const
        },
        fire: {
          title: 'Fire Emergency',
          message: 'Fire department assistance needed',
          priority: 'critical' as const
        }
      };

      const config = alertConfig[type];
      
      // Send to all family groups
      for (const group of familyGroups) {
        await emergencyFeaturesService.sendEmergencyAlert({
          type: type === 'medical' ? 'medical' : 'safety',
          ...config,
          family_group_id: group.id,
          created_by: currentUserId
        });
      }

      toast.success(`${config.title} alert sent to all family members`);
      loadEmergencyData();
    } catch (error) {
      console.error('Error sending one-click emergency:', error);
      toast.error('Failed to send emergency alert');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'medical': return Heart;
      case 'safety': return Shield;
      case 'location': return MapPin;
      default: return AlertTriangle;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Emergency Management</h2>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <Shield className="h-3 w-3 mr-1" />
          Emergency Ready
        </Badge>
      </div>

      {/* One-Click Emergency Buttons */}
      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Siren className="h-5 w-5" />
            One-Click Emergency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="destructive"
              size="lg"
              className="h-16 bg-red-600 hover:bg-red-700"
              onClick={() => handleOneClickEmergency('medical')}
            >
              <Heart className="h-6 w-6 mr-2" />
              Medical Emergency
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="h-16 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleOneClickEmergency('police')}
            >
              <Shield className="h-6 w-6 mr-2" />
              Safety Emergency
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="h-16 bg-orange-600 hover:bg-orange-700"
              onClick={() => handleOneClickEmergency('fire')}
            >
              <AlertTriangle className="h-6 w-6 mr-2" />
              Fire Emergency
            </Button>
          </div>
          
          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These buttons will immediately alert all family members and emergency contacts. 
              Use only in genuine emergencies.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Custom Emergency Alert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Custom Emergency Alert
            </div>
            <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Send Alert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Emergency Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Family Group</Label>
                    <Select 
                      value={emergencyForm.selectedGroup} 
                      onValueChange={(value) => setEmergencyForm(prev => ({ ...prev, selectedGroup: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select family group" />
                      </SelectTrigger>
                      <SelectContent>
                        {familyGroups.map(group => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Alert Type</Label>
                    <Select 
                      value={emergencyForm.type} 
                      onValueChange={(value: any) => setEmergencyForm(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Priority</Label>
                    <Select 
                      value={emergencyForm.priority} 
                      onValueChange={(value: any) => setEmergencyForm(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={emergencyForm.title}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Emergency title"
                    />
                  </div>
                  
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={emergencyForm.message}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Describe the emergency situation"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSendEmergencyAlert}>Send Alert</Button>
                    <Button variant="outline" onClick={() => setEmergencyDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Recent Alerts</h3>
              <p className="text-muted-foreground">Emergency alerts will appear here when sent.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAlerts.slice(0, 5).map((alert) => {
                const AlertIcon = getAlertIcon(alert.type);
                return (
                  <div key={alert.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-full ${getPriorityColor(alert.priority)}`}>
                      <AlertIcon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{alert.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={alert.status === 'resolved' ? 'default' : 'destructive'}>
                            {alert.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </div>
            <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Contact name"
                    />
                  </div>
                  
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number"
                      type="tel"
                    />
                  </div>
                  
                  <div>
                    <Label>Email (Optional)</Label>
                    <Input
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address"
                      type="email"
                    />
                  </div>
                  
                  <div>
                    <Label>Relationship</Label>
                    <Input
                      value={contactForm.relationship}
                      onChange={(e) => setContactForm(prev => ({ ...prev, relationship: e.target.value }))}
                      placeholder="e.g., Doctor, Family Member, Friend"
                    />
                  </div>
                  
                  <div>
                    <Label>Priority (1 = Highest)</Label>
                    <Select 
                      value={contactForm.priority.toString()} 
                      onValueChange={(value) => setContactForm(prev => ({ ...prev, priority: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Highest Priority</SelectItem>
                        <SelectItem value="2">2 - High Priority</SelectItem>
                        <SelectItem value="3">3 - Medium Priority</SelectItem>
                        <SelectItem value="4">4 - Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSaveContact}>
                      {selectedContact ? 'Update Contact' : 'Add Contact'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setContactDialogOpen(false);
                      setSelectedContact(null);
                      setContactForm({ name: '', phone: '', email: '', relationship: '', priority: 1 });
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencyContacts.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Emergency Contacts</h3>
              <p className="text-muted-foreground">Add emergency contacts for quick access during emergencies.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">{contact.priority}</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{contact.name}</h4>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <PhoneCall className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedContact(contact);
                        setContactForm({
                          name: contact.name,
                          phone: contact.phone,
                          email: contact.email || '',
                          relationship: contact.relationship,
                          priority: contact.priority
                        });
                        setContactDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};