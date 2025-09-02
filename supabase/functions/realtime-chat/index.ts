import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get OpenAI API key
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.error('OpenAI API key not found');
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  let openAISocket: WebSocket | null = null;
  let sessionConfigured = false;

  // Connect to OpenAI Realtime API
  const connectToOpenAI = () => {
    const openAIUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
    
    openAISocket = new WebSocket(openAIUrl, [], {
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    openAISocket.onopen = () => {
      console.log('Connected to OpenAI Realtime API');
    };

    openAISocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('OpenAI message:', data.type);

      // Handle session created event
      if (data.type === 'session.created' && !sessionConfigured) {
        // Configure session after connection
        const sessionConfig = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: "You are a helpful family communication assistant. Help family members communicate effectively and provide medication reminders when needed. Keep responses concise and supportive.",
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            tools: [
              {
                type: "function",
                name: "send_family_message",
                description: "Send a message to family members about medication reminders or health updates",
                parameters: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    message_type: { type: "string", enum: ["medication_reminder", "health_update", "emergency", "general"] },
                    priority: { type: "string", enum: ["low", "normal", "high", "urgent"] }
                  },
                  required: ["message", "message_type"]
                }
              },
              {
                type: "function", 
                name: "get_medication_status",
                description: "Get current medication adherence status for family members",
                parameters: {
                  type: "object",
                  properties: {
                    user_id: { type: "string" }
                  },
                  required: ["user_id"]
                }
              }
            ],
            tool_choice: "auto",
            temperature: 0.8,
            max_response_output_tokens: "inf"
          }
        };
        
        openAISocket?.send(JSON.stringify(sessionConfig));
        sessionConfigured = true;
      }

      // Handle function calls
      if (data.type === 'response.function_call_arguments.done') {
        const functionName = data.name;
        const args = JSON.parse(data.arguments);
        
        if (functionName === 'send_family_message') {
          // Store message in communication_logs
          supabase.from('communication_logs').insert({
            message_content: args.message,
            message_type: args.message_type,
            sender_id: null, // AI assistant
            family_group_id: null, // Will be set by client
            is_emergency: args.priority === 'urgent',
            message_data: { priority: args.priority, source: 'ai_assistant' }
          });
        }
      }

      // Forward all messages to client
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };

    openAISocket.onerror = (error) => {
      console.error('OpenAI WebSocket error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'OpenAI connection error'
      }));
    };

    openAISocket.onclose = () => {
      console.log('OpenAI WebSocket closed');
    };
  };

  socket.onopen = () => {
    console.log('Client WebSocket connected');
    connectToOpenAI();
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Client message:', message.type);

      // Authenticate user for certain operations
      if (message.type === 'authenticate') {
        // Handle authentication here if needed
        socket.send(JSON.stringify({
          type: 'authenticated',
          status: 'success'
        }));
        return;
      }

      // Forward message to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      } else {
        socket.send(JSON.stringify({
          type: 'error', 
          message: 'OpenAI connection not ready'
        }));
      }
    } catch (error) {
      console.error('Error processing client message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  };

  socket.onclose = () => {
    console.log('Client WebSocket disconnected');
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});