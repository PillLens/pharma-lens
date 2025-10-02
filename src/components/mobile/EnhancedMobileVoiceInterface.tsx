import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { hapticService } from '@/services/hapticService';
import { toast } from 'sonner';
import { useAIChatUsage } from '@/hooks/useAIChatUsage';
import { PaywallSheet } from '@/components/subscription/PaywallSheet';
import {
  Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff,
  Loader2, Waves, Bot, MessageSquare, HeadphonesIcon, Trash2, User, Clock, Crown
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EnhancedMobileVoiceInterfaceProps {
  familyGroupId?: string;
  onStatusChange?: (status: string) => void;
}

export const EnhancedMobileVoiceInterface: React.FC<EnhancedMobileVoiceInterfaceProps> = ({
  familyGroupId,
  onStatusChange
}) => {
  const [showPaywall, setShowPaywall] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const vibrationRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const { 
    messages, 
    isConnected, 
    isRecording: isListening,
    currentTranscript, 
    connect, 
    disconnect,
    clearHistory 
  } = useRealtimeChat();

  const { canChat, minutesUsed, minutesLimit, minutesRemaining, isUnlimited, loading: usageLoading, checkUsage, trackUsage } = useAIChatUsage();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  useEffect(() => {
    onStatusChange?.(connectionStatus);
  }, [connectionStatus, onStatusChange]);

  useEffect(() => {
    // Detect speaking from messages
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.type === 'assistant') {
      setIsSpeaking(true);
      const timer = setTimeout(() => setIsSpeaking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  useEffect(() => {
    // Haptic feedback when speaking state changes
    if (isSpeaking) {
      hapticService.feedback('light');
      // Start subtle vibration for speaking indication
      if ('vibrate' in navigator) {
        vibrationRef.current = window.setInterval(() => {
          navigator.vibrate(50);
        }, 2000) as any;
      }
    } else {
      // Stop vibration when not speaking
      if (vibrationRef.current) {
        clearInterval(vibrationRef.current);
        vibrationRef.current = null;
      }
    }

    return () => {
      if (vibrationRef.current) {
        clearInterval(vibrationRef.current);
      }
    };
  }, [isSpeaking]);

  const startMobileVoiceChat = async () => {
    try {
      // Check usage limits first
      if (!canChat) {
        setShowPaywall(true);
        toast.error(`You've used all ${minutesLimit} minutes this month. Upgrade to Pro for 10 AI voice minutes/month!`);
        return;
      }

      hapticService.buttonPress();
      setConnectionStatus('connecting');

      await connect();

      setConnectionStatus('connected');
      setSessionStartTime(new Date());
      
      // Start usage timer
      timerRef.current = window.setInterval(() => {
        setElapsedMinutes(prev => prev + (1 / 60)); // Update every second
      }, 1000);

      hapticService.feedback('success');
      toast.success('🎤 Voice assistant ready');

    } catch (error) {
      console.error('Error starting mobile voice chat:', error);
      hapticService.feedback('error');
      setConnectionStatus('error');
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.error('Microphone permission required for voice chat');
      } else {
        toast.error('Failed to start voice chat');
      }
    }
  };

  const endMobileVoiceChat = async () => {
    hapticService.buttonPress();
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Track usage
    if (sessionStartTime && elapsedMinutes > 0) {
      const roundedMinutes = Math.ceil(elapsedMinutes);
      await trackUsage(roundedMinutes);
      toast.success(`Session ended. ${roundedMinutes} minute${roundedMinutes > 1 ? 's' : ''} used.`);
    }

    disconnect();
    setConnectionStatus('disconnected');
    setSessionStartTime(null);
    setElapsedMinutes(0);
    
    // Clear any ongoing vibration
    if (vibrationRef.current) {
      clearInterval(vibrationRef.current);
      vibrationRef.current = null;
    }

    // Refresh usage after tracking
    await checkUsage();
  };

  const clearChatHistory = () => {
    hapticService.buttonPress();
    clearHistory();
    toast.success('Chat history cleared');
  };

  const getStatusColor = () => {
    if (isSpeaking) return 'bg-blue-500';
    if (isListening) return 'bg-green-500';
    if (isConnected) return 'bg-primary';
    return 'bg-muted';
  };

  const getStatusText = () => {
    if (connectionStatus === 'connecting') return 'Connecting...';
    if (isSpeaking) return 'AI Speaking...';
    if (isListening) return 'Listening...';
    if (isConnected) return 'Ready to Talk';
    return 'Voice Chat';
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-h-[70vh] flex flex-col">
      <Card className="backdrop-blur-sm bg-background/95 border-primary/20 shadow-xl flex flex-col max-h-full">
        <CardContent className="p-4 space-y-4 flex flex-col min-h-0">
          {/* Status Header */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()} transition-colors`} />
              <span className="font-medium text-sm">{getStatusText()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
                <Bot className="w-3 h-3 mr-1" />
                AI Assistant
              </Badge>
              {messages.length > 0 && (
                <Button
                  onClick={clearChatHistory}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Usage Indicator */}
          {!usageLoading && (
            <div className="flex-shrink-0 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {isUnlimited ? (
                      <span className="flex items-center gap-1">
                        <Crown className="w-4 h-4 text-amber-500" />
                        Unlimited
                      </span>
                    ) : (
                      `${Math.floor(minutesUsed)}/${minutesLimit} min`
                    )}
                  </span>
                </div>
                {isConnected && sessionStartTime && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {Math.floor(elapsedMinutes)}:{String(Math.floor((elapsedMinutes % 1) * 60)).padStart(2, '0')}
                  </Badge>
                )}
              </div>
              {!isUnlimited && (
                <>
                  <Progress value={(minutesUsed / minutesLimit) * 100} className="h-2 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.floor(minutesRemaining)} min remaining</span>
                    {minutesRemaining < 2 && (
                      <Button
                        onClick={() => setShowPaywall(true)}
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        Upgrade
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Chat History */}
          {messages.length > 0 && (
            <ScrollArea className="flex-1 min-h-0 max-h-[40vh] -mx-4 px-4">
              <div className="space-y-3 pb-2">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[85%] ${
                        msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {msg.type === 'user' ? (
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                        <span className="text-xs opacity-60 mt-1 block">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          )}

          {/* Live Transcript */}
          {currentTranscript && (
            <div className="p-3 bg-muted/50 rounded-lg flex-shrink-0">
              <div className="flex items-start gap-2">
                <Loader2 className="w-4 h-4 animate-spin mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{currentTranscript}</p>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {!isConnected ? (
              <Button
                onClick={startMobileVoiceChat}
                className="flex-1 h-12 text-sm font-medium"
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Start Voice Chat
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={endMobileVoiceChat}
                  variant="destructive"
                  className="flex-1 h-12 text-sm font-medium"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Chat
                </Button>
                <Button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    hapticService.buttonPress();
                  }}
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>

          {/* Visual Feedback */}
          {isListening && (
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-green-500 rounded-full animate-pulse"
                  style={{
                    height: Math.random() * 20 + 10 + 'px',
                    animationDelay: i * 0.1 + 's'
                  }}
                />
              ))}
            </div>
          )}

          {isSpeaking && (
            <div className="flex items-center justify-center gap-1 text-blue-500">
              <Waves className="w-4 h-4 animate-pulse" />
              <span className="text-xs">AI is speaking...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paywall Sheet */}
      <PaywallSheet
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="ai_chat_minutes_per_month"
      />
    </div>
  );
};