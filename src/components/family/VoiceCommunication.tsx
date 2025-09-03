import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { toast } from 'sonner';
import {
  Mic, MicOff, Send, Phone, PhoneOff, Volume2, VolumeX, 
  MessageSquare, Loader2, Bot, User, Waves
} from 'lucide-react';

interface VoiceCommunicationProps {
  familyGroupId: string;
  currentUserId: string;
}

export const VoiceCommunication: React.FC<VoiceCommunicationProps> = ({
  familyGroupId,
  currentUserId
}) => {
  const {
    messages,
    isConnected,
    isRecording,
    currentTranscript,
    connect,
    disconnect,
    sendTextMessage,
    startRecording,
    stopRecording
  } = useRealtimeChat();

  const [textInput, setTextInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentTranscript]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect to voice assistant');
    }
  };

  const handleSendText = () => {
    if (!textInput.trim()) return;
    
    sendTextMessage(textInput);
    setTextInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageIcon = (type: 'user' | 'assistant' | 'system') => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'assistant':
        return <Bot className="w-4 h-4" />;
      case 'system':
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              AI Family Assistant
            </span>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={handleConnect} className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Connect
              </Button>
            ) : (
              <>
                <Button 
                  onClick={disconnect}
                  variant="outline"
                  className="flex-1"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant="outline"
                  size="icon"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={() => setShowTranscript(!showTranscript)}
                  variant="outline"
                  size="icon"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice Controls */}
      {isConnected && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleRecording}
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className={`relative ${isRecording ? 'animate-pulse' : ''}`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>

              {isRecording && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Waves className="w-4 h-4 animate-pulse" />
                  Listening...
                </div>
              )}

              {currentTranscript && (
                <div className="flex-1 p-2 bg-muted rounded-md text-sm">
                  <span className="text-muted-foreground">Live transcript: </span>
                  {currentTranscript}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {isConnected && showTranscript && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80 px-4">
              <div className="space-y-4">
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
                        : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {getMessageIcon(message.type)}
                    </div>
                    
                    <div className={`flex flex-col max-w-[70%] ${
                      message.type === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize">
                          {message.type === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      
                      <div className={`rounded-lg px-3 py-2 max-w-full ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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

            {/* Text Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message to the AI assistant..."
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button 
                  onClick={handleSendText}
                  disabled={!textInput.trim() || !isConnected}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      {isConnected && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <h4 className="font-medium text-foreground">How to use:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Click "Start Recording" and speak naturally</li>
                <li>• Ask about medication reminders, family updates, or health questions</li>
                <li>• The AI can send messages to family members when needed</li>
                <li>• Use text input for silent communication</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};