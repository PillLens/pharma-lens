import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneCall, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CallInterfaceProps {
  familyGroupId: string;
  familyMembers: any[];
  currentUserId: string;
}

interface CallSession {
  id: string;
  caller_id: string;
  recipient_id: string;
  call_type: 'audio' | 'video';
  status: 'calling' | 'connected' | 'ended';
  started_at: string;
}

const CallInterface: React.FC<CallInterfaceProps> = ({
  familyGroupId,
  familyMembers,
  currentUserId
}) => {
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Set up real-time subscription for call events
    const channel = supabase
      .channel('family_calls')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'family_calls',
        filter: `family_group_id=eq.${familyGroupId}`
      }, (payload) => {
        handleCallEvent(payload);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [familyGroupId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const handleCallEvent = (payload: any) => {
    const call = payload.new as CallSession;
    
    if (call.recipient_id === currentUserId && call.status === 'calling') {
      // Incoming call
      setIncomingCall(call);
      toast({
        title: 'Incoming Call',
        description: `${getMemberName(call.caller_id)} is calling you`,
      });
    } else if (call.caller_id === currentUserId || call.recipient_id === currentUserId) {
      // Update active call status
      setActiveCall(call);
      
      if (call.status === 'ended') {
        endCall();
      }
    }
  };

  const getMemberName = (userId: string) => {
    const member = familyMembers.find(m => m.user_id === userId);
    return member?.profiles?.display_name || member?.email || 'Unknown Member';
  };

  const getMemberAvatar = (userId: string) => {
    const member = familyMembers.find(m => m.user_id === userId);
    return member?.profiles?.avatar_url;
  };

  const initiateCall = async (recipientId: string, callType: 'audio' | 'video') => {
    try {
      // Create call session in database
      const { data, error } = await supabase
        .from('family_calls')
        .insert({
          family_group_id: familyGroupId,
          caller_id: currentUserId,
          recipient_id: recipientId,
          call_type: callType,
          status: 'calling'
        })
        .select()
        .single();

      if (error) throw error;

      setActiveCall(data);
      
      toast({
        title: 'Calling...',
        description: `Calling ${getMemberName(recipientId)}`,
      });

    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: 'Call Failed',
        description: 'Unable to initiate call',
        variant: 'destructive',
      });
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      // Update call status to connected
      const { error } = await supabase
        .from('family_calls')
        .update({ status: 'connected' })
        .eq('id', incomingCall.id);

      if (error) throw error;

      setActiveCall(incomingCall);
      setIncomingCall(null);
      setCallDuration(0);

      toast({
        title: 'Call Connected',
        description: `Connected with ${getMemberName(incomingCall.caller_id)}`,
      });

    } catch (error) {
      console.error('Error answering call:', error);
      toast({
        title: 'Call Failed',
        description: 'Unable to answer call',
        variant: 'destructive',
      });
    }
  };

  const declineCall = async () => {
    if (!incomingCall) return;

    try {
      await supabase
        .from('family_calls')
        .update({ status: 'ended' })
        .eq('id', incomingCall.id);

      setIncomingCall(null);
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  const endCall = async () => {
    if (activeCall) {
      try {
        await supabase
          .from('family_calls')
          .update({ status: 'ended' })
          .eq('id', activeCall.id);
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }

    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setIsSpeakerOn(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Incoming call overlay
  if (incomingCall) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <Card className="w-80 mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={getMemberAvatar(incomingCall.caller_id)} />
                <AvatarFallback className="text-2xl">
                  {getMemberName(incomingCall.caller_id).charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{getMemberName(incomingCall.caller_id)}</CardTitle>
            <p className="text-muted-foreground">
              Incoming {incomingCall.call_type} call...
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4">
              <Button
                variant="destructive"
                size="lg"
                onClick={declineCall}
                className="rounded-full w-16 h-16"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={answerCall}
                className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
              >
                <Phone className="w-6 h-6" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active call interface
  if (activeCall) {
    const otherUserId = activeCall.caller_id === currentUserId 
      ? activeCall.recipient_id 
      : activeCall.caller_id;

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Call header */}
        <div className="p-4 text-white text-center">
          <div className="mb-2">
            <Avatar className="w-16 h-16 mx-auto mb-2">
              <AvatarImage src={getMemberAvatar(otherUserId)} />
              <AvatarFallback className="text-xl">
                {getMemberName(otherUserId).charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-xl font-semibold">{getMemberName(otherUserId)}</h2>
          <p className="text-white/70">
            {activeCall.status === 'connected' 
              ? formatDuration(callDuration)
              : 'Connecting...'
            }
          </p>
          <Badge variant={activeCall.call_type === 'video' ? 'default' : 'secondary'}>
            {activeCall.call_type} call
          </Badge>
        </div>

        {/* Video area */}
        {activeCall.call_type === 'video' && (
          <div className="flex-1 relative">
            <video
              ref={remoteVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
            <video
              ref={localVideoRef}
              className="absolute top-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-white"
              autoPlay
              playsInline
              muted
            />
          </div>
        )}

        {/* Audio-only call display */}
        {activeCall.call_type === 'audio' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage src={getMemberAvatar(otherUserId)} />
                <AvatarFallback className="text-4xl">
                  {getMemberName(otherUserId).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="w-32 h-32 mx-auto border-4 border-white/30 rounded-full flex items-center justify-center animate-pulse">
                <Volume2 className="w-16 h-16 text-white/50" />
              </div>
            </div>
          </div>
        )}

        {/* Call controls */}
        <div className="p-6">
          <div className="flex justify-center gap-6">
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="lg"
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-full w-14 h-14"
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            {activeCall.call_type === 'audio' && (
              <Button
                variant={isSpeakerOn ? 'default' : 'secondary'}
                size="lg"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className="rounded-full w-14 h-14"
              >
                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
            )}

            {activeCall.call_type === 'video' && (
              <Button
                variant={isVideoEnabled ? 'secondary' : 'destructive'}
                size="lg"
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className="rounded-full w-14 h-14"
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </Button>
            )}

            <Button
              variant="destructive"
              size="lg"
              onClick={endCall}
              className="rounded-full w-14 h-14"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Regular call interface (list of members to call)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Family Calls</h3>
      </div>

      <div className="grid gap-3">
        {familyMembers
          .filter(member => member.user_id !== currentUserId)
          .map((member) => (
            <Card key={member.user_id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles?.avatar_url} />
                      <AvatarFallback>
                        {(member.profiles?.display_name || member.email).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profiles?.display_name || member.email}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => initiateCall(member.user_id, 'audio')}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => initiateCall(member.user_id, 'video')}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {familyMembers.filter(m => m.user_id !== currentUserId).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No family members available to call</p>
        </div>
      )}
    </div>
  );
};

export default CallInterface;