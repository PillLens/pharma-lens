import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, AlertTriangle, Heart, Clock, Phone, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { realTimeCommunicationService, CommunicationMessage } from '@/services/realTimeCommunicationService';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface FamilyMessagingProps {
  familyGroupId: string;
  familyMembers: any[];
  currentUserId: string;
}

const FamilyMessaging: React.FC<FamilyMessagingProps> = ({
  familyGroupId,
  familyMembers,
  currentUserId
}) => {
  const { t } = useTranslation();
  
  // Safety checks for props
  if (!familyGroupId || !currentUserId) {
    console.error('FamilyMessaging: Missing required props', { familyGroupId, currentUserId });
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Unable to load messaging. Missing required information.</p>
      </div>
    );
  }
  
  if (!Array.isArray(familyMembers)) {
    console.error('FamilyMessaging: familyMembers is not an array', familyMembers);
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Unable to load messaging. Invalid family members data.</p>
      </div>
    );
  }
  
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'emergency'>('text');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('everyone');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    setupRealTimeSubscription();
    
    return () => {
      realTimeCommunicationService.cleanup();
    };
  }, [familyGroupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const familyMessages = await realTimeCommunicationService.getMessages(familyGroupId);
      setMessages(familyMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    return realTimeCommunicationService.subscribeToFamilyUpdates(
      familyGroupId,
      (message: CommunicationMessage) => {
        console.log('Real-time message:', message);
        loadMessages(); // Refresh messages
      }
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const success = await realTimeCommunicationService.sendMessage({
      family_group_id: familyGroupId,
      sender_id: currentUserId,
      content: newMessage,
      message_type: messageType === 'emergency' ? 'emergency' : 'text',
      recipient_id: selectedRecipient === 'everyone' ? undefined : selectedRecipient,
      metadata: {}
    });

      if (success) {
        setNewMessage('');
        setMessageType('text');
        await loadMessages(); // Refresh messages
      }
  };

  const handleEmergencyAlert = async () => {
    const success = await realTimeCommunicationService.sendMessage({
      family_group_id: familyGroupId,
      sender_id: currentUserId,
      content: 'Emergency assistance needed - please respond immediately',
      message_type: 'emergency',
      metadata: { priority: 'urgent', timestamp: new Date().toISOString() }
    });

    if (success) {
      toast({
        title: 'Emergency Alert Sent',
        description: 'All family members have been notified',
        variant: 'default',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMemberInfo = (userId: string) => {
    const member = familyMembers.find(m => m.user_id === userId);
    return {
      name: member?.profiles?.display_name || member?.email || 'Unknown',
      avatar: member?.profiles?.avatar_url,
      initials: member?.profiles?.display_name?.charAt(0) || member?.email?.charAt(0) || '?'
    };
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'medication_alert':
        return <Heart className="w-4 h-4 text-primary" />;
      case 'appointment_reminder':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const isCurrentUser = (userId: string) => userId === currentUserId;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('family.messaging.title')}</h3>
          <Badge variant="secondary">{messages.length}</Badge>
        </div>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={handleEmergencyAlert}
          className="animate-pulse"
        >
          <Phone className="w-4 h-4 mr-2" />
          Emergency Alert
        </Button>
      </div>

      {/* Messages Area */}
      <Card className="h-96">
        <CardContent className="p-0">
          <ScrollArea className="h-80 p-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages in this family group yet</p>
                <p className="text-xs">Start a conversation below</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const senderInfo = getMemberInfo(message.sender_id);
                  const isOwnMessage = isCurrentUser(message.sender_id);
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={senderInfo.avatar} />
                        <AvatarFallback className="text-xs">
                          {senderInfo.initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex-1 max-w-xs ${isOwnMessage ? 'text-right' : ''}`}>
                        <div className={`rounded-lg p-3 ${
                          message.message_type === 'emergency' 
                            ? 'bg-destructive/10 border border-destructive/20' 
                            : isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <div className="flex items-center gap-1 mb-1">
                            {getMessageIcon(message.message_type)}
                            {!isOwnMessage && (
                              <span className="text-xs font-medium">{senderInfo.name}</span>
                            )}
                            {message.message_type === 'emergency' && (
                              <Badge variant="destructive" className="text-xs">
                                EMERGENCY
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm">{message.content}</p>
                          
                          <div className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Message Type and Recipient Selection */}
            <div className="flex gap-2">
              <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Message</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="To: Everyone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Everyone</SelectItem>
                  {familyMembers.filter(m => m.user_id !== currentUserId).map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profiles?.display_name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={messageType === 'emergency' ? 'Describe the emergency...' : 'Type your message...'}
                className={messageType === 'emergency' ? 'border-destructive/50' : ''}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className={messageType === 'emergency' ? 'bg-destructive hover:bg-destructive/90' : ''}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewMessage('Daily medication reminder - please confirm when taken');
                  setMessageType('text');
                }}
              >
                <Heart className="w-3 h-3 mr-1" />
                Med Reminder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewMessage('How are you feeling today? Any symptoms to report?');
                  setMessageType('text');
                }}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Check-in
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyMessaging;