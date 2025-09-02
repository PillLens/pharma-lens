import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { instructions, voice = "alloy" } = await req.json();
    
    const systemPrompt = instructions || `You are a helpful family health assistant. You help families manage medications, coordinate care, and provide health guidance. 

Key capabilities:
- Answer questions about medications and health
- Help set medication reminders
- Provide family care coordination advice
- Handle emergency situations with appropriate urgency
- Give clear, actionable health guidance

Keep responses concise and supportive. Always prioritize safety and suggest consulting healthcare professionals for serious concerns.`;

    console.log('Creating OpenAI Realtime session with voice:', voice);

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: voice,
        instructions: systemPrompt,
        modalities: ["text", "audio"],
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        },
        tools: [
          {
            type: "function",
            name: "send_family_notification",
            description: "Send an important notification to family members about medications or health updates",
            parameters: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "The notification message to send"
                },
                priority: {
                  type: "string",
                  enum: ["low", "normal", "high", "urgent"],
                  description: "Priority level of the notification"
                },
                type: {
                  type: "string",
                  enum: ["medication", "health", "emergency", "reminder"],
                  description: "Type of notification"
                }
              },
              required: ["message", "type"]
            }
          },
          {
            type: "function",
            name: "get_medication_info",
            description: "Get information about a specific medication",
            parameters: {
              type: "object",
              properties: {
                medication_name: {
                  type: "string",
                  description: "Name of the medication to look up"
                }
              },
              required: ["medication_name"]
            }
          }
        ]
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI API error:", data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    console.log("Session created successfully:", data);
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error creating realtime session:", error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});