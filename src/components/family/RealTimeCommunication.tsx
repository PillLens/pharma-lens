import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Send, Phone, Video, Users, Clock, MapPin, 
  AlertCircle, Heart, Pill, Calendar, Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { realTimeCommunicationService } from '@/services/realTimeCommunicationService';

interface RealTimeCommunicationProps {
  familyGroup: any;
  currentUserId: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  message_type: 'text' | 'location' | 'medication_reminder' | 'emergency' | 'system';
  created_at: string;
  read_by: string[];
  metadata?: any;
  sender_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface PresenceState {
  user_id: string;
  online_at: string;
  status: 'online' | 'away' | 'busy';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const RealTimeCommunication: React.FC<RealTimeCommunicationProps> = ({
  familyGroup,
  currentUserId
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineMembers, setOnlineMembers] = useState<PresenceState[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    initializeRealTimeChat();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [familyGroup.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeRealTimeChat = async () => {
    try {
      setLoading(true);
      
      // Load recent messages
      const recentMessages = await realTimeCommunicationService.getRecentMessages(familyGroup.id);
      setMessages(recentMessages);

      // Set up real-time channel
      const channel = supabase
        .channel(`family_chat_${familyGroup.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'communication_logs',
            filter: `family_group_id=eq.${familyGroup.id}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            if (newMessage.sender_id !== currentUserId) {
              setMessages(prev => [...prev, newMessage]);
              
              // Show notification for important messages
              if (newMessage.message_type === 'emergency') {
                toast.error(`🚨 Emergency: ${newMessage.content}`);
              } else if (newMessage.message_type === 'medication_reminder') {
                toast.warning(`💊 Medication: ${newMessage.content}`);
              }
            }
          }
        )
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const online = Object.values(presenceState).flat() as PresenceState[];
          setOnlineMembers(online);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          const joinedUsers = newPresences as PresenceState[];
          setOnlineMembers(prev => [...prev, ...joinedUsers]);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          const leftUsers = leftPresences as PresenceState[];
          setOnlineMembers(prev => 
            prev.filter(member => 
              !leftUsers.some(left => left.user_id === member.user_id)
            )
          );
        })
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.user_id !== currentUserId) {
            setTyping(prev => {
              if (payload.typing) {
                return [...prev.filter(id => id !== payload.user_id), payload.user_id];
              } else {
                return prev.filter(id => id !== payload.user_id);
              }
            });
          }
        });

      channelRef.current = channel;

      // Subscribe and track presence
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
            status: 'online'
          });
        }
      });

    } catch (error) {
      console.error('Error initializing real-time chat:', error);
      toast.error('Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = await realTimeCommunicationService.sendMessage({
        family_group_id: familyGroup.id,
        sender_id: currentUserId,
        content: newMessage,
        message_type: 'text'
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Stop typing indicator
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: currentUserId, typing: false }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = (typing: boolean) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId, typing }
    });
  };

  const sendQuickMessage = async (type: 'location' | 'medication_reminder' | 'emergency', content?: string) => {
    try {
      let messageContent = content || '';
      let metadata = {};

      switch (type) {
        case 'location':
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
              const { latitude, longitude } = position.coords;
              messageContent = `📍 Shared location`;
              metadata = { latitude, longitude };
              
              const message = await realTimeCommunicationService.sendMessage({
                family_group_id: familyGroup.id,
                sender_id: currentUserId,
                content: messageContent,
                message_type: 'location',
                metadata
              });
              
              setMessages(prev => [...prev, message]);
            });
          }
          break;
        case 'medication_reminder':
          messageContent = `💊 Medication reminder: Time to take your medicine!`;
          break;
        case 'emergency':
          messageContent = `🚨 EMERGENCY ALERT: Need immediate assistance!`;
          break;
      }

      if (messageContent && type !== 'location') {
        const message = await realTimeCommunicationService.sendMessage({
          family_group_id: familyGroup.id,
          sender_id: currentUserId,
          content: messageContent,
          message_type: type,
          metadata
        });
        
        setMessages(prev => [...prev, message]);
      }

    } catch (error) {
      console.error('Error sending quick message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'medication_reminder': return <Pill className="w-4 h-4" />;
      case 'emergency': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'system': return <Bell className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Online Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4" />
            Online Now ({onlineMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-2">
            {onlineMembers.map((member) => {
              const memberData = familyGroup.members?.find((m: any) => m.user_id === member.user_id);
              return (
                <div key={member.user_id} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={memberData?.user_profile?.avatar_url} />
                      <AvatarFallback>
                        {memberData?.user_profile?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                    {memberData?.user_profile?.display_name || 'Unknown'}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="flex flex-col h-[500px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Family Chat
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => sendQuickMessage('location')}
              >
                <MapPin className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => sendQuickMessage('medication_reminder')}
              >
                <Pill className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => sendQuickMessage('emergency')}
              >
                <AlertCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === currentUserId;
                const memberData = familyGroup.members?.find((m: any) => m.user_id === message.sender_id);
                
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={memberData?.user_profile?.avatar_url} />
                      <AvatarFallback>
                        {memberData?.user_profile?.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!isOwnMessage && (
                          <span className="text-sm font-medium">
                            {memberData?.user_profile?.display_name || 'Unknown'}
                          </span>
                        )}
                        {getMessageIcon(message.message_type)}
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                      
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${
                          message.message_type === 'emergency'
                            ? 'border-2 border-destructive'
                            : ''
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.metadata?.latitude && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 p-1 h-auto text-xs"
                            onClick={() => {
                              const { latitude, longitude } = message.metadata;
                              window.open(`https://maps.google.com?q=${latitude},${longitude}`, '_blank');
                            }}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            View Location
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {typing.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-200"></div>
                  </div>
                  <span>
                    {typing.length === 1 ? '1 person is' : `${typing.length} people are`} typing...
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping(e.target.value.length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};