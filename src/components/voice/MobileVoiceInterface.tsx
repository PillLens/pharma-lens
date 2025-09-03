import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { hapticService } from '@/services/hapticService';
import {
  Mic, Bot, Phone, PhoneOff, Loader2, 
  Volume2, VolumeX, Waves
} from 'lucide-react';

interface MobileVoiceInterfaceProps {
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
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Calm, soothing" }
];

const OPENAI_VOICES = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "shimmer", name: "Shimmer" },
  { id: "nova", name: "Nova" },
  { id: "sage", name: "Sage" },
  { id: "ballad", name: "Ballad" }
];

const MobileVoiceInterface: React.FC<MobileVoiceInterfaceProps> = ({
  familyGroupId,
  onSpeakingChange
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [elevenLabsVoice, setElevenLabsVoice] = useState("9BWtsMINqrJLrRacOk9x");
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const chatRef = useRef<RealtimeChat | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    onSpeakingChange?.(isSpeaking);
  }, [isSpeaking, onSpeakingChange]);

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
        
      case 'error':
        console.error('Voice interface error:', event.error);
        toast.error(event.error.message || 'Voice interface error');
        break;
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

  const startConversation = async () => {
    try {
      hapticService.buttonPress();
      
      const instructions = `You are a helpful family health assistant named Aria. You help families manage medications, coordinate care, and provide health guidance.

Key responsibilities:
- Answer questions about medications and health
- Help set medication reminders and track adherence
- Provide family care coordination advice  
- Handle emergency situations with appropriate urgency
- Give clear, actionable health guidance

Keep responses concise (under 3 sentences), warm, and supportive. Always prioritize safety and suggest consulting healthcare professionals for serious medical concerns.`;

      chatRef.current = new RealtimeChat(handleMessage, setConnectionStatus);
      await chatRef.current.init(instructions, selectedVoice);
      setIsConnected(true);
      
      addMessage('system', 'Voice assistant connected. Start speaking!');
      toast.success('🎤 Voice assistant ready');
      hapticService.feedback('success');
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error(`Failed to start voice assistant: ${error instanceof Error ? error.message : 'Unknown error'}`);
      hapticService.feedback('error');
    }
  };

  const endConversation = () => {
    hapticService.buttonPress();
    chatRef.current?.disconnect();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
    setCurrentTranscript('');
    
    addMessage('system', 'Voice assistant disconnected');
    toast.success('Voice assistant disconnected');
  };

  const getStatusBadge = () => {
    if (connectionStatus === 'connecting') return { color: 'bg-yellow-500', text: 'Connecting...' };
    if (connectionStatus === 'connected') return { color: 'bg-green-500', text: 'Connected' };
    if (connectionStatus === 'error') return { color: 'bg-red-500', text: 'Error' };
    return { color: 'bg-gray-400', text: 'Disconnected' };
  };

  const selectedVoiceOption = VOICE_OPTIONS.find(v => v.id === elevenLabsVoice);
  const status = getStatusBadge();

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="pb-4 space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">AI Voice Assistant</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${status.color}`} />
                  <span className="text-sm text-muted-foreground">{status.text}</span>
                </div>
              </div>
            </div>
            {isConnected && (
              <Button
                onClick={() => setIsMuted(!isMuted)}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Voice Selection */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">OpenAI Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isConnected}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPENAI_VOICES.map(voice => (
                    <SelectItem key={voice.id} value={voice.id} className="py-3">
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">ElevenLabs Voice (TTS)</label>
              <Select value={elevenLabsVoice} onValueChange={setElevenLabsVoice}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue>
                    <div className="flex flex-col text-left">
                      <span className="font-medium">{selectedVoiceOption?.name}</span>
                      <span className="text-xs text-muted-foreground">{selectedVoiceOption?.description}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map(voice => (
                    <SelectItem key={voice.id} value={voice.id} className="py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-xs text-muted-foreground">{voice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Action Button */}
          <div className="pt-2">
            {!isConnected ? (
              <Button 
                onClick={startConversation} 
                className="w-full h-14 text-base font-medium"
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5 mr-3" />
                    Start Voice Chat
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={endConversation} 
                variant="destructive" 
                className="w-full h-14 text-base font-medium"
              >
                <PhoneOff className="w-5 h-5 mr-3" />
                End Chat
              </Button>
            )}
          </div>

          {/* Status Indicators */}
          {isConnected && (
            <div className="flex items-center justify-center gap-6 py-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <Mic className={`w-4 h-4 ${isListening ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">
                  {isListening ? 'Listening' : 'Ready'}
                </span>
              </div>
              
              <div className="w-px h-4 bg-border" />
              
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                <Waves className={`w-4 h-4 ${isSpeaking ? 'text-blue-600' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">
                  {isSpeaking ? 'Speaking' : 'Silent'}
                </span>
              </div>
            </div>
          )}

          {/* Live Transcript */}
          {currentTranscript && (
            <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-blue-500">
              <div className="flex items-center gap-2 mb-1">
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                <span className="text-xs font-medium text-blue-600">Assistant is speaking...</span>
              </div>
              <p className="text-sm text-muted-foreground italic">"{currentTranscript}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      {!isConnected && (
        <Card className="mt-4">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3 text-sm">How to use:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Click "Start Voice Chat" to begin conversation
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Speak naturally - the AI will respond with voice and text
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Ask about medications, family health, or care coordination
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Use "Play with ElevenLabs" for high-quality text-to-speech
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                The AI can send notifications to family members when needed
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default MobileVoiceInterface;