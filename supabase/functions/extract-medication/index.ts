import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { text, language = 'EN', region = 'AZ' } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create extraction prompt based on language and region
    const extractionPrompt = `Extract medication information from this text. Return ONLY a valid JSON object with the following structure:
{
  "brand_name": "string (required)",
  "generic_name": "string or null",
  "strength": "string or null", 
  "form": "string or null (tablet, capsule, syrup, etc)",
  "manufacturer": "string or null",
  "indications": ["string array of uses/conditions"],
  "dosage": "string or null",
  "warnings": ["string array of warnings/side effects"],
  "active_ingredients": ["string array"],
  "expiry_date": "YYYY-MM-DD or null",
  "barcode": "string or null",
  "confidence_score": number between 0.0 and 1.0
}

Text to analyze (Language: ${language}, Region: ${region}):
${text}

Respond with ONLY the JSON object, no additional text.`;

    console.log('Sending extraction request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a medical information extraction specialist. Extract medication data accurately and return only valid JSON.'
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;

    console.log('OpenAI response received:', extractedText);

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', extractedText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate required fields
    if (!extractedData.brand_name) {
      extractedData.confidence_score = 0.1;
      extractedData.brand_name = 'Unknown Medication';
    }

    // Ensure confidence score exists
    if (typeof extractedData.confidence_score !== 'number') {
      extractedData.confidence_score = 0.5;
    }

    // Store in database if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          {
            auth: {
              persistSession: false,
            },
            global: {
              headers: { Authorization: authHeader },
            },
          }
        );

        const { data: user } = await supabase.auth.getUser();
        
        if (user.user) {
          const { error: dbError } = await supabase
            .from('extractions')
            .insert({
              user_id: user.user.id,
              extracted_json: extractedData,
              quality_score: extractedData.confidence_score,
              model_version: 'gpt-4o-mini'
            });

          if (dbError) {
            console.error('Database insert error:', dbError);
          } else {
            console.log('Extraction saved to database');
          }
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in extract-medication function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract medication information',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});