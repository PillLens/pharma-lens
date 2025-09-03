import React, { useState } from 'react';
import { Phone, Video, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';

interface CallInterfaceProps {
  familyGroupId: string;
  familyMembers: any[];
  currentUserId: string;
}

const CallInterface: React.FC<CallInterfaceProps> = ({
  familyGroupId,
  familyMembers,
  currentUserId
}) => {
  const [activeCall, setActiveCall] = useState<string | null>(null);

  const getMemberName = (member: any) => {
    return member?.profiles?.display_name || member?.user_profile?.display_name || member?.email || 'Unknown Member';
  };

  const initiateCall = (recipientId: string, callType: 'audio' | 'video') => {
    const member = familyMembers.find(m => m.user_id === recipientId);
    const memberName = getMemberName(member);
    
    setActiveCall(recipientId);
    
    // Simulate call functionality for now
    toast({
      title: `${callType === 'video' ? 'Video' : 'Audio'} Call`,
      description: `Calling ${memberName}... (Feature coming soon)`,
    });

    // Auto-end simulation after 3 seconds
    setTimeout(() => {
      setActiveCall(null);
      toast({
        title: 'Call Ended',
        description: `Call with ${memberName} ended`,
      });
    }, 3000);
  };

  const sendMessage = (recipientId: string) => {
    const member = familyMembers.find(m => m.user_id === recipientId);
    const memberName = getMemberName(member);
    
    toast({
      title: 'Message Sent',
      description: `Quick message sent to ${memberName}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Family Communication</h3>
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
                      <AvatarImage src={member.profiles?.avatar_url || member.user_profile?.avatar_url} />
                      <AvatarFallback>
                        {getMemberName(member).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {getMemberName(member)}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {member.role}
                      </p>
                      {activeCall === member.user_id && (
                        <p className="text-xs text-primary animate-pulse">
                          Calling...
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendMessage(member.user_id)}
                      disabled={activeCall === member.user_id}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => initiateCall(member.user_id, 'audio')}
                      disabled={activeCall === member.user_id}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => initiateCall(member.user_id, 'video')}
                      disabled={activeCall === member.user_id}
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