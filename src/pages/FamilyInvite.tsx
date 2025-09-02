import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { familySharingService } from '@/services/familySharingService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationData {
  groupId: string;
  inviterName: string;
  familyGroupName: string;
  role: string;
  invitedEmail: string;
}

const FamilyInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseInvitationData = () => {
      try {
        const encodedData = searchParams.get('data');
        if (!encodedData) {
          setError('Invalid invitation link - missing data');
          setLoading(false);
          return;
        }

        const decodedData = atob(encodedData);
        const parsedData: InvitationData = JSON.parse(decodedData);
        
        // Validate required fields
        if (!parsedData.groupId || !parsedData.inviterName || !parsedData.familyGroupName || !parsedData.role) {
          setError('Invalid invitation data');
          setLoading(false);
          return;
        }

        setInvitationData(parsedData);
        setLoading(false);
      } catch (err) {
        console.error('Error parsing invitation data:', err);
        setError('Invalid invitation link format');
        setLoading(false);
      }
    };

    parseInvitationData();
  }, [searchParams]);

  const handleAcceptInvitation = async () => {
    if (!user || !invitationData) return;

    // Check if user email matches invited email
    if (user.email !== invitationData.invitedEmail) {
      setError(`This invitation was sent to ${invitationData.invitedEmail}. Please sign in with that email address.`);
      return;
    }

    setProcessing(true);
    try {
      const success = await familySharingService.respondToInvitation(
        invitationData.groupId, 
        'accepted'
      );

      if (success) {
        toast.success('Invitation accepted! Welcome to the family group.');
        navigate('/family');
      } else {
        setError('Failed to accept invitation. The invitation may have expired or been withdrawn.');
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('An error occurred while accepting the invitation.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!user || !invitationData) return;

    setProcessing(true);
    try {
      const success = await familySharingService.respondToInvitation(
        invitationData.groupId, 
        'declined'
      );

      if (success) {
        toast.success('Invitation declined.');
        navigate('/');
      } else {
        setError('Failed to decline invitation.');
      }
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError('An error occurred while declining the invitation.');
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              variant="outline"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to sign in to accept this family group invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitationData && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Invitation Details:</p>
                <p className="font-medium">{invitationData.familyGroupName}</p>
                <p className="text-sm text-muted-foreground">
                  From: {invitationData.inviterName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Role: {invitationData.role}
                </p>
              </div>
            )}
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Sign In to Accept Invitation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Family Group Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a family group
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitationData && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Family Group:</p>
                <p className="font-semibold">{invitationData.familyGroupName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invited by:</p>
                <p className="font-medium">{invitationData.inviterName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your role:</p>
                <p className="font-medium capitalize">{invitationData.role.replace('_', ' ')}</p>
              </div>
            </div>
          )}

          {user.email !== invitationData?.invitedEmail && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation was sent to {invitationData?.invitedEmail}. 
                You are signed in as {user.email}.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleAcceptInvitation}
              disabled={processing || user.email !== invitationData?.invitedEmail}
              className="flex-1"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Accept
            </Button>
            <Button
              onClick={handleDeclineInvitation}
              disabled={processing}
              variant="outline"
              className="flex-1"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Decline
            </Button>
          </div>

          <div className="text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/family')}
            >
              Go to Family Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyInvite;