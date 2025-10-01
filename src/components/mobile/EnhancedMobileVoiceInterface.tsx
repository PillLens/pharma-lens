import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { hapticService } from '@/services/hapticService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff,
  Loader2, Waves, Bot, MessageSquare, HeadphonesIcon
} from 'lucide-react';

interface EnhancedMobileVoiceInterfaceProps {
  familyGroupId?: string;
  onStatusChange?: (status: string) => void;
}

export const EnhancedMobileVoiceInterface: React.FC<EnhancedMobileVoiceInterfaceProps> = ({
  familyGroupId,
  onStatusChange
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastMessage, setLastMessage] = useState('');

  const chatRef = useRef<RealtimeChat | null>(null);
  const vibrationRef = useRef<number | null>(null);

  useEffect(() => {
    onStatusChange?.(connectionStatus);
  }, [connectionStatus, onStatusChange]);

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

  const handleMessage = (event: any) => {
    console.log('Mobile voice message:', event);
    
    switch (event.type) {
      case 'response.audio_transcript.delta':
        if (event.delta) {
          setCurrentTranscript(prev => prev + event.delta);
        }
        break;
        
      case 'response.audio_transcript.done':
        if (currentTranscript.trim()) {
          setLastMessage(currentTranscript);
          setCurrentTranscript('');
          hapticService.feedback('success');
        }
        break;
        
      case 'response.audio.delta':
        setIsSpeaking(true);
        break;
        
      case 'response.audio.done':
        setIsSpeaking(false);
        hapticService.feedback('light');
        break;
        
      case 'input_audio_buffer.speech_started':
        setIsListening(true);
        hapticService.feedback('light');
        break;
        
      case 'input_audio_buffer.speech_stopped':
        setIsListening(false);
        break;
        
      case 'error':
        console.error('Mobile voice error:', event.error);
        hapticService.feedback('error');
        toast.error('Voice error: ' + (event.error.message || 'Unknown error'));
        break;
    }
  };

  const startMobileVoiceChat = async () => {
    try {
      hapticService.buttonPress();

      // Request permissions first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream

      const mobileInstructions = `You are Aria, a mobile family health assistant. You're optimized for quick, mobile conversations.

Key mobile behaviors:
- Keep responses very brief and conversational (1-2 sentences max)
- Be extra warm and personal since this is a mobile, intimate interaction
- Focus on immediate, actionable advice
- Use simple language suitable for voice interaction
- Prioritize urgent health and medication needs
- Offer to send family notifications when appropriate

Remember: This is a mobile conversation, so be concise, warm, and helpful.`;

      chatRef.current = new RealtimeChat(handleMessage, setConnectionStatus);
      await chatRef.current.init(mobileInstructions, 'shimmer'); // Use Nova voice for mobile

      setIsConnected(true);
      hapticService.feedback('success');
      toast.success('🎤 Voice assistant ready');

    } catch (error) {
      console.error('Error starting mobile voice chat:', error);
      hapticService.feedback('error');
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast.error('Microphone permission required for voice chat');
      } else {
        toast.error('Failed to start voice chat');
      }
    }
  };

  const endMobileVoiceChat = () => {
    hapticService.buttonPress();
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setCurrentTranscript('');
    
    // Clear any ongoing vibration
    if (vibrationRef.current) {
      clearInterval(vibrationRef.current);
      vibrationRef.current = null;
    }

    toast.success('Voice chat ended');
  };

  const playLastMessageWithElevenLabs = async () => {
    if (!lastMessage.trim()) return;

    try {
      hapticService.buttonPress();
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: {
          text: lastMessage,
          voice_id: "9BWtsMINqrJLrRacOk9x", // Aria voice
          model: "eleven_turbo_v2_5"
        }
      });

      if (error) throw error;

      if (data.audioContent) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        
        const audio = new Audio(URL.createObjectURL(audioBlob));
        await audio.play();
        
        audio.onended = () => {
          URL.revokeObjectURL(audio.src);
          hapticService.feedback('success');
        };
        
        toast.success('🔊 Playing with premium voice');
      }
    } catch (error) {
      console.error('Error playing with ElevenLabs:', error);
      hapticService.feedback('error');
      toast.error('Failed to play premium voice');
    }
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
    <div className="fixed bottom-20 left-4 right-4 z-50">
      <Card className="backdrop-blur-sm bg-background/95 border-primary/20 shadow-xl">
        <CardContent className="p-4 space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()} transition-colors`} />
              <span className="font-medium text-sm">{getStatusText()}</span>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
              <Bot className="w-3 h-3 mr-1" />
              AI Assistant
            </Badge>
          </div>

          {/* Live Transcript */}
          {(currentTranscript || lastMessage) && (
            <div className="p-3 bg-muted/50 rounded-lg">
              {currentTranscript ? (
                <div className="flex items-start gap-2">
                  <Loader2 className="w-4 h-4 animate-spin mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{currentTranscript}</p>
                </div>
              ) : lastMessage ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                    <p className="text-sm">{lastMessage}</p>
                  </div>
                  <Button
                    onClick={playLastMessageWithElevenLabs}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                  >
                    <HeadphonesIcon className="w-3 h-3 mr-1" />
                    Premium Voice
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
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
    </div>
  );
};