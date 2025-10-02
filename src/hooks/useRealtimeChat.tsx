import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audio?: Uint8Array;
}

interface AudioRecorderConfig {
  sampleRate: number;
  channelCount: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private onLevelUpdate?: (level: number) => void;

  constructor(
    private onAudioData: (audioData: Float32Array) => void,
    onLevelUpdate?: (level: number) => void
  ) {
    this.onLevelUpdate = onLevelUpdate;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      // Create analyser for audio level monitoring
      if (this.onLevelUpdate) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.source.connect(this.analyser);
        this.startLevelMonitoring();
      }

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  private startLevelMonitoring() {
    if (!this.analyser || !this.onLevelUpdate) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateLevel = () => {
      if (!this.analyser || !this.onLevelUpdate) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const normalizedLevel = Math.min(100, (average / 128) * 100);
      
      this.onLevelUpdate(normalizedLevel);
      requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }

  stop() {
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }
}

export const useRealtimeChat = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Restore messages from localStorage on mount
    const savedMessages = localStorage.getItem('ai-chat-messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioLevelRef = useRef<number>(0);
  const latencyRef = useRef<number[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai-chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Monitor connection quality based on latency
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (latencyRef.current.length > 0) {
        const avgLatency = latencyRef.current.reduce((a, b) => a + b, 0) / latencyRef.current.length;
        
        if (avgLatency < 100) {
          setConnectionQuality('excellent');
        } else if (avgLatency < 300) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('poor');
        }
        
        // Keep only last 10 latency measurements
        latencyRef.current = latencyRef.current.slice(-10);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const maxRetries = 3;
    let retryCount = reconnectAttemptsRef.current;
    let retryDelay = 1000;

    const attemptConnection = async (): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const startTime = Date.now();
          wsRef.current = new WebSocket('wss://bquxkkaipevuakmqqilk.functions.supabase.co/functions/v1/realtime-chat');
          
          wsRef.current.onopen = () => {
            const latency = Date.now() - startTime;
            latencyRef.current.push(latency);
            
            console.log('Connected to realtime chat', { latency });
            setIsConnected(true);
            reconnectAttemptsRef.current = 0;
            retryCount = 0;
            
            // Initialize audio context
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext({ sampleRate: 24000 });
              audioQueueRef.current = new AudioQueue(audioContextRef.current);
            }
            
            // Notify successful reconnection if this was a reconnect
            if (reconnectAttemptsRef.current > 0) {
              toast.success('Reconnected successfully!');
            }
            
            resolve();
          };

          wsRef.current.onmessage = async (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('Received message type:', data.type);

              switch (data.type) {
                case 'response.audio.delta':
                  if (audioQueueRef.current && data.delta) {
                    const binaryString = atob(data.delta);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    await audioQueueRef.current.addToQueue(bytes);
                  }
                  break;

                case 'response.audio_transcript.delta':
                  if (data.delta) {
                    setCurrentTranscript(prev => prev + data.delta);
                  }
                  break;

                case 'response.audio_transcript.done':
                  if (currentTranscript) {
                    const newMessage: Message = {
                      id: Date.now().toString(),
                      type: 'assistant',
                      content: currentTranscript,
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, newMessage]);
                    setCurrentTranscript('');
                  }
                  break;

                case 'response.done':
                  console.log('Response completed');
                  break;

                case 'error':
                  const errorCode = data.error?.code;
                  const errorMessage = data.error?.message || 'Unknown error';
                  
                  console.error('WebSocket error:', data.error);
                  
                  // Handle specific error codes
                  if (errorCode === 429 || errorCode === 'rate_limit_exceeded') {
                    toast.error('Rate limit exceeded. Please wait a moment and try again.');
                  } else if (errorCode === 503 || errorCode === 'service_unavailable') {
                    toast.error('Service temporarily unavailable. Retrying...');
                    // Attempt reconnection
                    setTimeout(() => {
                      if (retryCount < maxRetries) {
                        retryCount++;
                        attemptConnection().catch(console.error);
                      }
                    }, retryDelay);
                  } else {
                    toast.error('Connection error: ' + errorMessage);
                  }
                  break;
              }
            } catch (error) {
              console.error('Error parsing message:', error);
              toast.error('Error processing message');
            }
          };

          wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            
            reconnectAttemptsRef.current++;
            
            if (retryCount < maxRetries) {
              retryCount++;
              toast.error(`Connection error. Retrying (${retryCount}/${maxRetries})...`);
              
              setTimeout(() => {
                attemptConnection().catch(reject);
              }, retryDelay * retryCount);
            } else {
              setIsConnected(false);
              toast.error('Connection failed after multiple attempts');
              reject(error);
            }
          };

          wsRef.current.onclose = (event) => {
            console.log('WebSocket closed', event.code, event.reason);
            setIsConnected(false);
            setIsRecording(false);
            
            // Handle abnormal closures
            if (event.code !== 1000 && event.code !== 1001) {
              if (retryCount < maxRetries) {
                retryCount++;
                toast.error(`Connection closed unexpectedly. Retrying (${retryCount}/${maxRetries})...`);
                
                setTimeout(() => {
                  attemptConnection().catch(reject);
                }, retryDelay * retryCount);
              } else {
                toast.error('Connection lost. Please try reconnecting.');
                reject(new Error('Connection closed'));
              }
            }
          };
        } catch (error) {
          console.error('Error connecting to WebSocket:', error);
          reject(error);
        }
      });
    };

    try {
      await attemptConnection();
    } catch (error) {
      console.error('Failed to establish connection:', error);
      toast.error('Failed to connect. Please try again.');
    }
  }, [currentTranscript]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
    }
    setIsConnected(false);
    setIsRecording(false);
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Not connected');
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);

    // Send to OpenAI
    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    };

    wsRef.current.send(JSON.stringify(event));
    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  const startRecording = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Not connected');
      return;
    }

    try {
      audioRecorderRef.current = new AudioRecorder(
        (audioData: Float32Array) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const encodedAudio = encodeAudioForAPI(audioData);
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: encodedAudio
            }));
          }
        },
        (level: number) => {
          audioLevelRef.current = level;
          setAudioLevel(level);
        }
      );

      await audioRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    setIsRecording(false);
    setAudioLevel(0);
    toast.success('Recording stopped');
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('ai-chat-messages');
    toast.success('Conversation history cleared');
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    isConnected,
    isRecording,
    currentTranscript,
    audioLevel,
    connectionQuality,
    connect,
    disconnect,
    sendTextMessage,
    startRecording,
    stopRecording,
    clearHistory
  };
};