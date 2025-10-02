import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticService } from '@/services/hapticService';
import { useTranslation } from '@/hooks/useTranslation';
import { useAIChatUsage } from '@/hooks/useAIChatUsage';
import { PaywallSheet } from '@/components/subscription/PaywallSheet';
import { SUPPORTED_VOICES } from '@/utils/voiceConfig';
import {
  Mic, Volume2, VolumeX, Bot, User, 
  Settings, Phone, PhoneOff, Waves, MessageSquare,
  Loader2, HeadphonesIcon, Clock, Crown,
  Signal, Trash2, Activity, Download, Save, FileText, 
  BarChart3, History as HistoryIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceAnalyticsDashboard } from './VoiceAnalyticsDashboard';
import { VoiceSettingsPanel } from './VoiceSettingsPanel';
import { ConversationHistory } from './ConversationHistory';
import { useAuth } from '@/hooks/useAuth';

interface EnhancedVoiceInterfaceProps {
  familyGroupId?: string;
  onSpeakingChange?: (speaking: boolean) => void;
}

// ElevenLabs voice options for TTS playback
const ELEVENLABS_VOICES = [
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria", description: "Warm, conversational" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Professional, clear" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Friendly, helpful" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Calm, soothing" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Energetic, upbeat" }
];

export const EnhancedVoiceInterface: React.FC<EnhancedVoiceInterfaceProps> = ({ 
  familyGroupId, 
  onSpeakingChange 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedVoice, setSelectedVoice] = useState(() => 
    localStorage.getItem('voice_preference') || "alloy"
  );
  const [elevenLabsVoice, setElevenLabsVoice] = useState("9BWtsMINqrJLrRacOk9x");
  const [isMuted, setIsMuted] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [inGracePeriod, setInGracePeriod] = useState(false);
  const [gracePeriodSeconds, setGracePeriodSeconds] = useState(15);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { 
    messages, 
    isConnected, 
    isRecording: isListening,
    currentTranscript, 
    audioLevel,
    connect, 
    disconnect,
    clearHistory 
  } = useRealtimeChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const usageCheckRef = useRef<number | null>(null);
  const gracePeriodTimerRef = useRef<number | null>(null);

  const { canChat, minutesUsed, minutesLimit, minutesRemaining, isUnlimited, loading: usageLoading, checkUsage, trackUsage } = useAIChatUsage();

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentTranscript]);

  // Notify parent of speaking state
  useEffect(() => {
    onSpeakingChange?.(isSpeaking);
  }, [isSpeaking, onSpeakingChange]);

  // Detect speaking from messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.type === 'assistant') {
      setIsSpeaking(true);
      const timer = setTimeout(() => setIsSpeaking(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Save voice preference
  useEffect(() => {
    localStorage.setItem('voice_preference', selectedVoice);
  }, [selectedVoice]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && isConnected) {
        e.preventDefault();
        endConversation();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isConnected]);

  // Usage monitoring
  useEffect(() => {
    if (!isConnected || isUnlimited) return;

    usageCheckRef.current = window.setInterval(async () => {
      await checkUsage();
      
      const timeRemaining = minutesLimit - (minutesUsed + elapsedMinutes);
      
      if (timeRemaining <= 1 && timeRemaining > 0 && !warningShown) {
        setWarningShown(true);
        toast.warning(`⚠️ Only ${Math.ceil(timeRemaining * 60)} seconds remaining!`, {
          duration: 5000,
        });
        hapticService.feedback('warning');
      }
      
      if (timeRemaining <= 0 && !inGracePeriod) {
        setInGracePeriod(true);
        toast.warning('Time limit reached! You have 15 seconds to finish your conversation.', {
          duration: 5000,
        });
        
        setGracePeriodSeconds(15);
        gracePeriodTimerRef.current = window.setInterval(() => {
          setGracePeriodSeconds(prev => {
            if (prev <= 1) {
              endConversation();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }, 15000);

    return () => {
      if (usageCheckRef.current) clearInterval(usageCheckRef.current);
    };
  }, [isConnected, isUnlimited, minutesUsed, minutesLimit, elapsedMinutes, warningShown, inGracePeriod]);

  const startConversation = async () => {
    try {
      if (!canChat) {
        setShowPaywall(true);
        toast.error(`You've used all ${minutesLimit} minutes this month. Upgrade to Pro for 10 AI voice minutes/month!`);
        return;
      }

      hapticService.buttonPress();
      setWarningShown(false);
      setInGracePeriod(false);
      setGracePeriodSeconds(15);
      
      await connect();
      setSessionStartTime(new Date());
      
      timerRef.current = window.setInterval(() => {
        setElapsedMinutes(prev => prev + (1 / 60));
      }, 1000);
      
      toast.success(t('toast.voice.ready'));
      hapticService.feedback('success');
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error(t('toast.voice.startError') + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
      hapticService.feedback('error');
    }
  };

  const endConversation = async () => {
    hapticService.buttonPress();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (usageCheckRef.current) {
      clearInterval(usageCheckRef.current);
      usageCheckRef.current = null;
    }
    if (gracePeriodTimerRef.current) {
      clearInterval(gracePeriodTimerRef.current);
      gracePeriodTimerRef.current = null;
    }

    if (sessionStartTime && elapsedMinutes > 0) {
      const roundedMinutes = Math.ceil(elapsedMinutes);
      await trackUsage(roundedMinutes);
      
      // Track analytics for this session
      if (user?.id) {
        try {
          // Note: Using any type casting until Supabase types are regenerated
          await (supabase as any).from('voice_conversation_analytics').insert({
            user_id: user.id,
            session_start: sessionStartTime.toISOString(),
            session_end: new Date().toISOString(),
            duration_minutes: elapsedMinutes,
            message_count: messages.length,
            estimated_cost: elapsedMinutes * 0.06, // $0.06 per minute
            voice_used: selectedVoice
          });
        } catch (analyticsError) {
          console.error('Error tracking analytics:', analyticsError);
          // Don't block the session end if analytics fails
        }
      }
      
      if (inGracePeriod) {
        toast.info('Conversation ended due to time limit. Thank you for using PillLens!');
      } else {
        toast.success(`Session ended. ${roundedMinutes} minute${roundedMinutes > 1 ? 's' : ''} used.`);
      }
    }

    disconnect();
    setSessionStartTime(null);
    setElapsedMinutes(0);
    setWarningShown(false);
    setInGracePeriod(false);
    setGracePeriodSeconds(15);

    await checkUsage();
  };

  const playTextWithElevenLabs = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text,
          voice_id: elevenLabsVoice,
          model: "eleven_turbo_v2_5"
        }
      });

      if (error) throw error;

      if (data.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
          
          audioRef.current.onended = () => {
            URL.revokeObjectURL(audioUrl);
          };
        }
        
        toast.success(t('toast.voice.premiumVoice'));
      }
    } catch (error) {
      console.error('Error with ElevenLabs TTS:', error);
      toast.error(t('toast.voice.premiumVoiceError'));
    }
  };

  // Phase 3 Feature: Export conversation (JSON + TXT)
  const exportConversation = () => {
    const exportData = {
      session: {
        start: sessionStartTime,
        duration: elapsedMinutes,
        voice: selectedVoice
      },
      messages: messages.map(m => ({
        type: m.type,
        content: m.content,
        timestamp: m.timestamp
      }))
    };

    // JSON export
    const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `conversation-${new Date().toISOString()}.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

    // TXT export
    const txtContent = `Conversation Export - ${new Date(sessionStartTime || new Date()).toLocaleString()}\n` +
      `Duration: ${elapsedMinutes.toFixed(1)} minutes\n` +
      `Voice: ${selectedVoice}\n\n` +
      messages.map((m) => {
        const time = new Date(m.timestamp).toLocaleTimeString();
        return `[${time}] ${m.type === 'user' ? 'You' : 'AI'}: ${m.content}`;
      }).join('\n\n');

    const txtBlob = new Blob([txtContent], { type: 'text/plain' });
    const txtUrl = URL.createObjectURL(txtBlob);
    const txtLink = document.createElement('a');
    txtLink.href = txtUrl;
    txtLink.download = `conversation-${new Date().toISOString()}.txt`;
    txtLink.click();
    URL.revokeObjectURL(txtUrl);

    toast.success('Conversation exported (JSON + TXT)');
  };

  // Phase 3 Feature: Save conversation to Supabase
  const saveConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !familyGroupId) {
        toast.error('Cannot save: no family group connected');
        return;
      }

      const { error } = await supabase.from('communication_logs').insert({
        family_group_id: familyGroupId,
        sender_id: user.id,
        message_type: 'ai_conversation' as any,
        message_content: `AI Voice Conversation - ${messages.length} messages`,
        is_emergency: false,
        message_data: {
          messages: messages.map(m => ({
            type: m.type,
            content: m.content,
            timestamp: m.timestamp
          })),
          duration: elapsedMinutes,
          voice: selectedVoice
        } as any
      } as any);

      if (error) throw error;
      toast.success('Conversation saved!');
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast.error('Failed to save conversation');
    }
  };

  const getConnectionQualityIcon = (level: number) => {
    if (level > 70) return <Signal className="w-4 h-4 text-green-500" />;
    if (level > 40) return <Signal className="w-4 h-4 text-yellow-500" />;
    return <Signal className="w-4 h-4 text-red-500" />;
  };

  const getUsageProgressColor = () => {
    const percentage = (minutesUsed / minutesLimit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4" role="region" aria-label="AI Voice Assistant">
      {/* Connection Status & Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5" aria-hidden="true" />
              <span>AI Voice Assistant</span>
              <div className="flex items-center gap-2">
                <div 
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}
                  role="status"
                  aria-label={`Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`}
                />
                <span className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Usage Display */}
          {!usageLoading && (
            <Card className={`border-primary/20 ${inGracePeriod ? 'border-red-500 animate-pulse' : ''}`}>
              <CardContent className="p-4">
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
                        `${Math.floor(minutesUsed)}/${minutesLimit} min used`
                      )}
                    </span>
                  </div>
                  {isConnected && sessionStartTime && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.floor(elapsedMinutes)}:{String(Math.floor((elapsedMinutes % 1) * 60)).padStart(2, '0')}
                      </Badge>
                      {inGracePeriod && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                          Grace: {gracePeriodSeconds}s
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {!isUnlimited && (
                  <div className="space-y-1">
                    <div className="relative">
                      <Progress 
                        value={(minutesUsed / minutesLimit) * 100} 
                        className="h-2"
                      />
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getUsageProgressColor()}`}
                        style={{ width: `${Math.min((minutesUsed / minutesLimit) * 100, 100)}%` }}
                      />
                    </div>
                    {(minutesUsed / minutesLimit) >= 0.5 && (minutesUsed / minutesLimit) < 0.75 && (
                      <p className="text-xs text-yellow-600">
                        ⚠️ You've used 50% of your monthly minutes
                      </p>
                    )}
                    {(minutesUsed / minutesLimit) >= 0.75 && (minutesUsed / minutesLimit) < 0.9 && (
                      <p className="text-xs text-orange-600 font-medium">
                        ⚠️ You've used 75% of your monthly minutes
                      </p>
                    )}
                    {(minutesUsed / minutesLimit) >= 0.9 && !inGracePeriod && (
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ Critical: You've used 90% of your monthly minutes
                      </p>
                    )}
                    {inGracePeriod && (
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ Time limit reached. Conversation will end in {gracePeriodSeconds} seconds.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Voice Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isConnected}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_VOICES.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span>{voice.name}</span>
                        <span className="text-xs text-muted-foreground">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ElevenLabs Voice (TTS)</label>
              <Select value={elevenLabsVoice} onValueChange={setElevenLabsVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ELEVENLABS_VOICES.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span>{voice.name}</span>
                        <span className="text-xs text-muted-foreground">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Connection Controls */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                onClick={startConversation} 
                className="flex-1" 
                aria-label="Start voice chat"
              >
                <Phone className="w-4 h-4 mr-2" aria-hidden="true" />
                Start Voice Chat
              </Button>
            ) : (
              <>
                <Button 
                  onClick={endConversation} 
                  variant="destructive" 
                  className="flex-1"
                  aria-label="End chat (Press Escape)"
                >
                  <PhoneOff className="w-4 h-4 mr-2" aria-hidden="true" />
                  End Chat
                </Button>
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant="outline"
                  size="icon"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>

          {/* Keyboard Shortcuts Help */}
          {isConnected && (
            <div className="text-xs text-muted-foreground text-center border-t pt-2">
              <kbd className="px-2 py-1 bg-muted rounded">Esc</kbd> to end chat
            </div>
          )}

          {/* Status Indicators with Audio Level */}
          {isConnected && (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2" role="status" aria-live="polite">
                  <Mic className={`w-4 h-4 ${isListening ? 'text-green-500' : 'text-muted-foreground'}`} aria-hidden="true" />
                  <span className={isListening ? 'text-green-600' : 'text-muted-foreground'}>
                    {isListening ? 'Listening...' : 'Ready'}
                  </span>
                </div>
                <div className="flex items-center gap-2" role="status" aria-live="polite">
                  <Waves className={`w-4 h-4 ${isSpeaking ? 'text-blue-500' : 'text-muted-foreground'}`} aria-hidden="true" />
                  <span className={isSpeaking ? 'text-blue-600' : 'text-muted-foreground'}>
                    {isSpeaking ? 'Speaking...' : 'Silent'}
                  </span>
                </div>
              </div>
              
              {/* Audio Level Meter */}
              {isListening && audioLevel !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">Audio Level</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-100"
                      style={{ width: `${Math.min(100, audioLevel)}%` }}
                      role="progressbar"
                      aria-label="Microphone input level"
                      aria-valuenow={Math.round(audioLevel)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation History */}
      {messages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                Conversation
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportConversation}
                  aria-label="Export conversation"
                >
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  Export
                </Button>
                {familyGroupId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveConversation}
                    aria-label="Save conversation"
                  >
                    <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                    Save
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  aria-label="Clear conversation history"
                >
                  <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80 px-4" role="log" aria-label="Conversation messages">
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      message.type === 'user' 
                        ? 'bg-primary text-primary-foreground'
                        : message.type === 'assistant'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : message.type === 'assistant' ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <Settings className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className={`flex flex-col max-w-[70%] ${
                      message.type === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">
                          {message.type === 'user' ? 'You' : message.type === 'assistant' ? 'Assistant' : 'System'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className={`rounded-lg px-3 py-2 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.type === 'assistant'
                          ? 'bg-muted'
                          : 'bg-muted/50'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.type === 'assistant' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 h-6 px-2 text-xs"
                            onClick={() => playTextWithElevenLabs(message.content)}
                          >
                            <HeadphonesIcon className="w-3 h-3 mr-1" />
                            Play with ElevenLabs
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {currentTranscript && (
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                      <p className="text-sm text-muted-foreground">
                        {currentTranscript || 'AI is thinking...'}
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Hidden audio element for ElevenLabs playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      <PaywallSheet 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
      />

      {/* Advanced Features Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <ConversationHistory 
            userId={user?.id}
            familyGroupId={familyGroupId}
            onReplay={(conv) => {
              toast.info('Replay feature coming soon!');
            }}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <VoiceAnalyticsDashboard 
            userId={user?.id}
            minutesUsed={minutesUsed}
            minutesLimit={minutesLimit}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <VoiceSettingsPanel userId={user?.id} />
        </TabsContent>
      </Tabs>

      {/* Usage Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <h4 className="font-medium text-foreground">How to use:</h4>
            <ul className="space-y-1 ml-4">
              <li>• Click "Start Voice Chat" to begin conversation</li>
              <li>• Speak naturally - the AI will respond with voice and text</li>
              <li>• Ask about medications, family health, or care coordination</li>
              <li>• Use "Play with ElevenLabs" for high-quality text-to-speech</li>
              <li>• Export or save your conversation for future reference</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
