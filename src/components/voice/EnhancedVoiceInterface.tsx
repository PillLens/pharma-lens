import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticService } from '@/services/hapticService';
import { useTranslation } from '@/hooks/useTranslation';
import { useAIChatUsage } from '@/hooks/useAIChatUsage';
import { PaywallSheet } from '@/components/subscription/PaywallSheet';
import {
  Mic, MicOff, Volume2, VolumeX, Bot, User, 
  Settings, Phone, PhoneOff, Waves, MessageSquare,
  Loader2, Speaker, HeadphonesIcon, Clock, Crown,
  Wifi, WifiOff, Signal, Trash2, Activity
} from 'lucide-react';

interface EnhancedVoiceInterfaceProps {
  familyGroupId?: string;
  onSpeakingChange?: (speaking: boolean) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
}

// ElevenLabs voice options
const VOICE_OPTIONS = [
  { id: "9BWtsMINqrJLrRacOk9x", name: "Aria", description: "Warm, conversational" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Professional, clear" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Friendly, helpful" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Calm, soothing" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Energetic, upbeat" }
];

const OPENAI_VOICES = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "shimmer", name: "Shimmer" },
  { id: "nova", name: "Nova" },
  { id: "sage", name: "Sage" },
  { id: "ballad", name: "Ballad" }
];

export const EnhancedVoiceInterface: React.FC<EnhancedVoiceInterfaceProps> = ({ 
  familyGroupId, 
  onSpeakingChange 
}) => {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [useElevenLabs, setUseElevenLabs] = useState(false);
  const [elevenLabsVoice, setElevenLabsVoice] = useState("9BWtsMINqrJLrRacOk9x");
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [inGracePeriod, setInGracePeriod] = useState(false);
  const [gracePeriodSeconds, setGracePeriodSeconds] = useState(15);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  
  const chatRef = useRef<RealtimeChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const usageCheckRef = useRef<number | null>(null);
  const gracePeriodTimerRef = useRef<number | null>(null);

  const { canChat, minutesUsed, minutesLimit, minutesRemaining, isUnlimited, loading: usageLoading, checkUsage, trackUsage } = useAIChatUsage();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentTranscript]);

  useEffect(() => {
    onSpeakingChange?.(isSpeaking);
  }, [isSpeaking, onSpeakingChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space to toggle mic (when connected)
      if (e.code === 'Space' && isConnected && !e.repeat) {
        e.preventDefault();
        if (isListening) {
          // Stop recording functionality would go here
          console.log('Stop recording');
        } else {
          // Start recording functionality would go here
          console.log('Start recording');
        }
      }
      
      // Escape to end conversation
      if (e.code === 'Escape' && isConnected) {
        e.preventDefault();
        endConversation();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isConnected, isListening]);

  const handleMessage = (event: any) => {
    console.log('Received message:', event);
    
    switch (event.type) {
      case 'response.audio_transcript.delta':
        if (event.delta) {
          setCurrentTranscript(prev => prev + event.delta);
        }
        break;
        
      case 'response.audio_transcript.done':
        if (currentTranscript.trim()) {
          addMessage('assistant', currentTranscript, true);
          setCurrentTranscript('');
        }
        break;
        
      case 'response.audio.delta':
        setIsSpeaking(true);
        break;
        
      case 'response.audio.done':
        setIsSpeaking(false);
        break;
        
      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        hapticService.feedback('light');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        break;
        
      case 'response.function_call_arguments.done':
        handleFunctionCall(event.name, JSON.parse(event.arguments || '{}'));
        break;
        
      case 'error':
        console.error('Voice interface error:', event.error);
        toast.error(t('toast.voice.error') + ': ' + (event.error.message || 'Unknown error'));
        break;
    }
  };

  const handleFunctionCall = async (functionName: string, args: any) => {
    console.log('Function call:', functionName, args);
    
    switch (functionName) {
      case 'send_family_notification':
        if (familyGroupId) {
          // Send notification to family members
          await sendFamilyNotification(args.message, args.type, args.priority);
        }
        break;
        
      case 'get_medication_info':
        // This would typically query the medication database
        console.log('Looking up medication:', args.medication_name);
        break;
    }
  };

  const sendFamilyNotification = async (message: string, type: string, priority: string = 'normal') => {
    try {
      const { error } = await supabase
        .from('communication_logs')
        .insert({
          family_group_id: familyGroupId,
          message_content: message,
          message_type: type,
          sender_id: null, // AI assistant
          is_emergency: priority === 'urgent',
          message_data: { 
            priority, 
            source: 'ai_assistant',
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;
      
      toast.success(t('toast.family.emergencyAlertSent'));
      hapticService.feedback('success');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const addMessage = (type: 'user' | 'assistant' | 'system', content: string, isAudio = false) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      isAudio
    };
    setMessages(prev => [...prev, message]);
  };

  const clearHistory = () => {
    setMessages([]);
    toast.success('Conversation history cleared');
  };

  // Usage monitoring effect
  useEffect(() => {
    if (!isConnected || isUnlimited) return;

    // Check usage every 15 seconds
    usageCheckRef.current = window.setInterval(async () => {
      await checkUsage();
      
      const timeRemaining = minutesLimit - (minutesUsed + elapsedMinutes);
      
      // Show warning at 1 minute remaining
      if (timeRemaining <= 1 && timeRemaining > 0 && !warningShown) {
        setWarningShown(true);
        toast.warning(`⚠️ Only ${Math.ceil(timeRemaining * 60)} seconds remaining!`, {
          duration: 5000,
        });
        hapticService.feedback('warning');
      }
      
      // Start grace period when time runs out
      if (timeRemaining <= 0 && !inGracePeriod) {
        setInGracePeriod(true);
        toast.warning('Time limit reached! You have 15 seconds to finish your conversation.', {
          duration: 5000,
        });
        
        // Start grace period countdown
        setGracePeriodSeconds(15);
        gracePeriodTimerRef.current = window.setInterval(() => {
          setGracePeriodSeconds(prev => {
            if (prev <= 1) {
              // End conversation after grace period
              endConversation();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }, 15000);

    return () => {
      if (usageCheckRef.current) {
        clearInterval(usageCheckRef.current);
      }
    };
  }, [isConnected, isUnlimited, minutesUsed, minutesLimit, elapsedMinutes, warningShown, inGracePeriod]);

  const startConversation = async () => {
    try {
      // Check usage limits first
      if (!canChat) {
        setShowPaywall(true);
        toast.error(`You've used all ${minutesLimit} minutes this month. Upgrade to Pro for 10 AI voice minutes/month!`);
        return;
      }

      hapticService.buttonPress();
      
      // Reset warning states
      setWarningShown(false);
      setInGracePeriod(false);
      setGracePeriodSeconds(15);
      
      const instructions = `You are a helpful family health assistant named Aria. You help families manage medications, coordinate care, and provide health guidance for the ${familyGroupId ? 'family group' : 'user'}.

Key responsibilities:
- Answer questions about medications and health
- Help set medication reminders and track adherence
- Provide family care coordination advice  
- Handle emergency situations with appropriate urgency
- Give clear, actionable health guidance
- Send notifications when requested

Keep responses concise (under 3 sentences usually), warm, and supportive. Always prioritize safety and suggest consulting healthcare professionals for serious medical concerns.`;

      chatRef.current = new RealtimeChat(handleMessage, setConnectionStatus);
      await chatRef.current.init(instructions, selectedVoice);
      setIsConnected(true);
      setSessionStartTime(new Date());
      
      // Start usage timer
      timerRef.current = window.setInterval(() => {
        setElapsedMinutes(prev => prev + (1 / 60)); // Update every second
      }, 1000);
      
      addMessage('system', 'Voice assistant connected. Start speaking!');
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
    
    // Stop all timers
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

    // Track usage
    if (sessionStartTime && elapsedMinutes > 0) {
      const roundedMinutes = Math.ceil(elapsedMinutes);
      await trackUsage(roundedMinutes);
      
      if (inGracePeriod) {
        toast.info('Conversation ended due to time limit. Thank you for using PillLens!');
      } else {
        toast.success(`Session ended. ${roundedMinutes} minute${roundedMinutes > 1 ? 's' : ''} used.`);
      }
    }

    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setCurrentTranscript('');
    setSessionStartTime(null);
    setElapsedMinutes(0);
    setWarningShown(false);
    setInGracePeriod(false);
    setGracePeriodSeconds(15);
    
    addMessage('system', 'Voice assistant disconnected');

    // Refresh usage after tracking
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

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Disconnected';
    }
  };

  const getConnectionQualityIcon = (quality: 'excellent' | 'good' | 'poor') => {
    switch (quality) {
      case 'excellent': return <Signal className="w-4 h-4 text-green-500" />;
      case 'good': return <Signal className="w-4 h-4 text-yellow-500" />;
      case 'poor': return <Signal className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionQualityText = (quality: 'excellent' | 'good' | 'poor') => {
    return quality.charAt(0).toUpperCase() + quality.slice(1);
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
                  className={`w-2 h-2 rounded-full ${getConnectionStatusColor(connectionStatus)}`}
                  role="status"
                  aria-label={`Connection status: ${getConnectionStatusText(connectionStatus)}`}
                />
                <span className="text-sm text-muted-foreground">
                  {getConnectionStatusText(connectionStatus)}
                </span>
              </div>
              {isConnected && connectionQuality && (
                <div 
                  className="flex items-center gap-1" 
                  title={`Connection quality: ${getConnectionQualityText(connectionQuality)}`}
                  role="status"
                  aria-label={`Connection quality: ${getConnectionQualityText(connectionQuality)}`}
                >
                  {getConnectionQualityIcon(connectionQuality)}
                  <span className="text-xs text-muted-foreground">
                    {getConnectionQualityText(connectionQuality)}
                  </span>
                </div>
              )}
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
                  {!isUnlimited && !inGracePeriod && (
                    <span className={`text-xs ${minutesRemaining <= 1 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                      {Math.floor(minutesRemaining)} min remaining
                    </span>
                  )}
                </div>
                {!isUnlimited && (
                  <div className="space-y-1">
                    <Progress 
                      value={(minutesUsed / minutesLimit) * 100} 
                      className={`h-2 ${minutesRemaining <= 1 ? 'bg-red-100' : ''}`}
                    />
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
              <label className="text-sm font-medium">OpenAI Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isConnected}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPENAI_VOICES.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
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
                  {VOICE_OPTIONS.map(voice => (
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
                disabled={connectionStatus === 'connecting'}
                aria-label="Start voice chat"
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" aria-hidden="true" />
                    Start Voice Chat
                  </>
                )}
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
              <kbd className="px-2 py-1 bg-muted rounded">Space</kbd> to toggle mic • 
              <kbd className="px-2 py-1 bg-muted rounded ml-2">Esc</kbd> to end chat
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
                  <Speaker className={`w-4 h-4 ${isSpeaking ? 'text-blue-500' : 'text-muted-foreground'}`} aria-hidden="true" />
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
      {isConnected && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" aria-hidden="true" />
                Conversation
              </CardTitle>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  aria-label="Clear conversation history"
                >
                  <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  Clear
                </Button>
              )}
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
                        {message.isAudio && (
                          <Badge variant="outline" className="text-xs">
                            <Waves className="w-3 h-3 mr-1" />
                            Voice
                          </Badge>
                        )}
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
              <li>• The AI can send notifications to family members when needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};