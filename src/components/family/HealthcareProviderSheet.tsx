import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Calendar, FileText, Send, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { familySharingService, FamilyGroup } from '@/services/familySharingService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface HealthcareProviderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  familyGroups: FamilyGroup[];
  analyticsData?: any;
}

interface HealthcareProvider {
  id?: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface ContactRequest {
  provider_id: string;
  message: string;
  include_analytics: boolean;
  urgency: 'routine' | 'urgent' | 'emergency';
  family_group_id?: string;
}

export const HealthcareProviderSheet: React.FC<HealthcareProviderSheetProps> = ({
  isOpen,
  onClose,
  familyGroups,
  analyticsData
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'providers' | 'contact'>('providers');
  const [providers, setProviders] = useState<HealthcareProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);

  const [newProvider, setNewProvider] = useState<HealthcareProvider>({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const [contactRequest, setContactRequest] = useState<ContactRequest>({
    provider_id: '',
    message: '',
    include_analytics: true,
    urgency: 'routine',
    family_group_id: familyGroups[0]?.id || ''
  });

  useEffect(() => {
    if (isOpen && user) {
      loadHealthcareProviders();
    }
  }, [isOpen, user]);

  const loadHealthcareProviders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('healthcare_providers')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading healthcare providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async () => {
    if (!user || !newProvider.name || !newProvider.phone) {
      toast({
        title: 'Missing Information',
        description: 'Please provide at least provider name and phone number.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('healthcare_providers')
        .insert({
          ...newProvider,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setProviders(prev => [...prev, data]);
      setNewProvider({
        name: '',
        specialty: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
      setShowAddProvider(false);

      toast({
        title: 'Provider Added',
        description: 'Healthcare provider has been added successfully.',
      });
    } catch (error) {
      console.error('Error adding provider:', error);
      toast({
        title: 'Error',
        description: 'Failed to add healthcare provider.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendContactRequest = async () => {
    if (!selectedProvider || !contactRequest.message) {
      toast({
        title: 'Missing Information',
        description: 'Please select a provider and enter a message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Generate analytics report if requested
      let analyticsReport = null;
      if (contactRequest.include_analytics && analyticsData) {
        analyticsReport = {
          date_generated: new Date().toISOString(),
          patient_info: {
            name: user?.email,
            family_groups: familyGroups.length
          },
          health_metrics: analyticsData,
          medication_adherence: analyticsData?.overallAdherence || 0,
          recent_symptoms: [], // Could be fetched from daily checkups
          care_team_notes: contactRequest.message
        };
      }

      // Save contact request to database
      const { error } = await supabase
        .from('provider_contact_requests')
        .insert({
          user_id: user?.id,
          provider_id: selectedProvider.id,
          provider_name: selectedProvider.name,
          provider_phone: selectedProvider.phone,
          provider_email: selectedProvider.email,
          message: contactRequest.message,
          urgency: contactRequest.urgency,
          analytics_report: analyticsReport,
          family_group_id: contactRequest.family_group_id,
          status: 'pending'
        });

      if (error) throw error;

      // Send notification email to provider if email exists
      if (selectedProvider.email) {
        try {
          await supabase.functions.invoke('send-provider-contact', {
            body: {
              provider_email: selectedProvider.email,
              provider_name: selectedProvider.name,
              patient_name: user?.email,
              message: contactRequest.message,
              urgency: contactRequest.urgency,
              analytics_report: analyticsReport,
              contact_phone: selectedProvider.phone
            }
          });
        } catch (emailError) {
          console.error('Error sending email to provider:', emailError);
          // Don't fail the whole process if email fails
        }
      }

      toast({
        title: 'Contact Request Sent',
        description: `Your ${contactRequest.urgency} request has been sent to ${selectedProvider.name}.`,
      });

      // Reset form
      setContactRequest({
        provider_id: '',
        message: '',
        include_analytics: true,
        urgency: 'routine',
        family_group_id: familyGroups[0]?.id || ''
      });
      setSelectedProvider(null);
      setActiveTab('providers');

    } catch (error) {
      console.error('Error sending contact request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send contact request to healthcare provider.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnalytics = async () => {
    if (!analyticsData) {
      toast({
        title: 'No Data Available',
        description: 'No analytics data available to export.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create a comprehensive report
      const report = {
        generated_date: new Date().toISOString(),
        patient_info: {
          id: user?.id,
          email: user?.email,
          family_groups_count: familyGroups.length
        },
        health_summary: {
          overall_adherence: analyticsData.overallAdherence || 0,
          active_medications: analyticsData.activeMedications || 0,
          family_members: analyticsData.totalMembers || 0,
          care_score: analyticsData.careScore || 'N/A'
        },
        detailed_analytics: analyticsData
      };

      // Convert to JSON and download
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Analytics Exported',
        description: 'Your health analytics have been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export analytics data.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Healthcare Providers
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('providers')}
              className={`flex-1 pb-2 px-4 text-sm font-medium transition-colors ${
                activeTab === 'providers' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Providers
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 pb-2 px-4 text-sm font-medium transition-colors ${
                activeTab === 'contact' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Contact Provider
            </button>
          </div>

          {/* Providers Tab */}
          {activeTab === 'providers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Your Healthcare Team</h3>
                <Button
                  onClick={() => setShowAddProvider(true)}
                  size="sm"
                  variant="outline"
                >
                  Add Provider
                </Button>
              </div>

              {/* Add Provider Form */}
              {showAddProvider && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Add New Provider</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="provider-name">Name *</Label>
                        <Input
                          id="provider-name"
                          value={newProvider.name}
                          onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Dr. Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="provider-specialty">Specialty</Label>
                        <Input
                          id="provider-specialty"
                          value={newProvider.specialty}
                          onChange={(e) => setNewProvider(prev => ({ ...prev, specialty: e.target.value }))}
                          placeholder="Cardiologist"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="provider-phone">Phone *</Label>
                        <Input
                          id="provider-phone"
                          value={newProvider.phone}
                          onChange={(e) => setNewProvider(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="provider-email">Email</Label>
                        <Input
                          id="provider-email"
                          type="email"
                          value={newProvider.email}
                          onChange={(e) => setNewProvider(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="doctor@clinic.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="provider-address">Address</Label>
                      <Input
                        id="provider-address"
                        value={newProvider.address}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Medical Center Blvd"
                      />
                    </div>
                    <div>
                      <Label htmlFor="provider-notes">Notes</Label>
                      <Textarea
                        id="provider-notes"
                        value={newProvider.notes}
                        onChange={(e) => setNewProvider(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional notes about this provider..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddProvider} disabled={loading}>
                        {loading ? 'Adding...' : 'Add Provider'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddProvider(false)}>
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Providers List */}
              <div className="space-y-3">
                {providers.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Phone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No healthcare providers added yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  providers.map((provider) => (
                    <Card key={provider.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{provider.name}</h4>
                            {provider.specialty && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {provider.specialty}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProvider(provider);
                              setContactRequest(prev => ({ ...prev, provider_id: provider.id || '' }));
                              setActiveTab('contact');
                            }}
                          >
                            Contact
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{provider.phone}</span>
                          </div>
                          {provider.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span>{provider.email}</span>
                            </div>
                          )}
                          {provider.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              <span>{provider.address}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleExportAnalytics}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Health Analytics
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Schedule appointment functionality
                        toast({
                          title: 'Feature Coming Soon',
                          description: 'Appointment scheduling will be available soon.',
                        });
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contact Provider Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Healthcare Provider</h3>

              {selectedProvider ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{selectedProvider.name}</h4>
                      <Badge variant="outline">
                        {selectedProvider.specialty || 'Healthcare Provider'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-3 h-3" />
                        <span>{selectedProvider.phone}</span>
                      </div>
                      {selectedProvider.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span>{selectedProvider.email}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <Label>Select Provider</Label>
                    <Select
                      value={contactRequest.provider_id}
                      onValueChange={(value) => {
                        const provider = providers.find(p => p.id === value);
                        setSelectedProvider(provider || null);
                        setContactRequest(prev => ({ ...prev, provider_id: value }));
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose a healthcare provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id || ''}>
                            {provider.name} - {provider.specialty || 'Provider'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              )}

              {selectedProvider && (
                <>
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <Label>Urgency Level</Label>
                        <Select
                          value={contactRequest.urgency}
                          onValueChange={(value: 'routine' | 'urgent' | 'emergency') => 
                            setContactRequest(prev => ({ ...prev, urgency: value }))
                          }
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="routine">Routine - Response within 24-48 hours</SelectItem>
                            <SelectItem value="urgent">Urgent - Response within 4-6 hours</SelectItem>
                            <SelectItem value="emergency">Emergency - Immediate attention needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Message</Label>
                        <Textarea
                          value={contactRequest.message}
                          onChange={(e) => setContactRequest(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Describe your concern or question..."
                          className="mt-2 min-h-[100px]"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="include-analytics"
                          checked={contactRequest.include_analytics}
                          onChange={(e) => setContactRequest(prev => ({ ...prev, include_analytics: e.target.checked }))}
                        />
                        <Label htmlFor="include-analytics" className="text-sm">
                          Include health analytics and family care data
                        </Label>
                      </div>

                      {familyGroups.length > 0 && (
                        <div>
                          <Label>Family Group Context</Label>
                          <Select
                            value={contactRequest.family_group_id}
                            onValueChange={(value) => setContactRequest(prev => ({ ...prev, family_group_id: value }))}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select family group context" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No family context</SelectItem>
                              {familyGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Button
                    onClick={handleSendContactRequest}
                    disabled={loading || !contactRequest.message}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? 'Sending...' : `Send ${contactRequest.urgency} Request`}
                  </Button>
                </>
              )}

              {providers.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Phone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      You need to add healthcare providers first.
                    </p>
                    <Button onClick={() => setActiveTab('providers')} variant="outline">
                      Add Providers
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HealthcareProviderSheet;