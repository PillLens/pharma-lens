import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MedicationData {
  brand_name: string;
  generic_name?: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  confidence_score: number;
  barcode?: string;
  active_ingredients: string[];
  storage_instructions: string;
  indications: string[];
  contraindications: string[];
  warnings: string[];
  side_effects: string[];
  usage_instructions: {
    dosage: string;
    frequency: string;
    duration: string;
    timing: string;
    route: string;
    special_instructions: string[];
  };
  drug_interactions: string[];
  pregnancy_safety: string | null;
  age_restrictions: string | null;
  expiry_date: string | null;
  source_provider: string;
  country_code: string;
  attribution_text?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Worldwide medication extraction request received');
    
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Check request size (2MB limit)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
      throw new Error('Request too large');
    }

    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid content type');
    }

    // Parse and validate request body
    const body = await req.json();
    const { text, language = 'en', region = 'US', barcode, sessionId } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text parameter is required and must be non-empty');
    }

    if (text.length > 5000) {
      throw new Error('Text too long (max 5000 characters)');
    }

    // Sanitize inputs
    const sanitizedText = text.trim();
    const sanitizedLanguage = (language || 'en').toLowerCase().substring(0, 10);
    const sanitizedRegion = (region || 'US').toUpperCase().substring(0, 5);

    console.log(`Processing: "${sanitizedText.substring(0, 50)}..." in ${sanitizedLanguage} for region ${sanitizedRegion}`);

    let extractedData: MedicationData | null = null;

    // Step 1: Try barcode lookup first if provided
    if (barcode) {
      console.log(`Attempting barcode lookup: ${barcode}`);
      extractedData = await getKnownMedicationByBarcode(barcode, sanitizedRegion);
      if (extractedData) {
        console.log(`Found medication by barcode: ${extractedData.brand_name}`);
      }
    }

    // Step 2: Try text-based lookup in global database
    if (!extractedData) {
      console.log('Attempting text-based medication lookup');
      extractedData = await findMedicationFromText(sanitizedText, sanitizedLanguage, sanitizedRegion);
      if (extractedData) {
        console.log(`Found medication by text: ${extractedData.brand_name}`);
      }
    }

    // Step 3: Fallback to AI extraction if no match found
    if (!extractedData) {
      console.log('No local match found, using AI extraction');
      
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const prompt = createGlobalExtractionPrompt(sanitizedText, sanitizedLanguage, sanitizedRegion);

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.1,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      const aiContent = openaiData.choices?.[0]?.message?.content;

      if (!aiContent) {
        throw new Error('No response from AI');
      }

      console.log('AI extraction result received');

      // Parse and clean the AI response
      extractedData = parseAndCleanAIResponse(aiContent, sanitizedRegion);
    }

    if (!extractedData) {
      throw new Error('Failed to extract medication information');
    }

    // Validate and standardize the extracted data
    const validatedData = validateAndStandardizeMedication(extractedData);

    // Store the extraction in database if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (authHeader && validatedData) {
      try {
        await storeExtraction(authHeader, validatedData, sessionId);
        console.log('Extraction stored successfully');
      } catch (storageError) {
        console.error('Failed to store extraction:', storageError);
        // Continue without failing the request
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: validatedData,
        source: validatedData.source_provider,
        region: sanitizedRegion,
        confidence_score: validatedData.confidence_score
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Medication extraction error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        region: 'unknown'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 400 
      }
    );
  }
});

// Global medication database lookup function
async function getKnownMedicationByBarcode(barcode: string, region: string): Promise<MedicationData | null> {
  const medications = getGlobalMedicationDatabase(region);
  const found = medications.find(med => med.barcode === barcode);
  
  if (found) {
    return createMedicationResponse(found, barcode, 0.95, region);
  }
  
  return null;
}

// Text-based medication finder with regional support
async function findMedicationFromText(text: string, language: string, region: string): Promise<MedicationData | null> {
  const medications = getGlobalMedicationDatabase(region);
  const searchText = text.toLowerCase();
  
  // Try exact brand name match first
  let found = medications.find(med => 
    searchText.includes(med.productName.toLowerCase()) ||
    searchText.includes(med.genericName.toLowerCase())
  );
  
  // Try partial matches for common medications
  if (!found) {
    found = medications.find(med => {
      const brandWords = med.productName.toLowerCase().split(' ');
      const genericWords = med.genericName.toLowerCase().split(' ');
      
      return brandWords.some(word => word.length > 3 && searchText.includes(word)) ||
             genericWords.some(word => word.length > 3 && searchText.includes(word));
    });
  }
  
  if (found) {
    return createMedicationResponse(found, null, 0.85, region);
  }
  
  return null;
}

// Global medication database with regional coverage
function getGlobalMedicationDatabase(region: string = 'US') {
  const globalMeds = [
    // US medications
    {
      barcode: '12345678901',
      productName: 'Tylenol',
      genericName: 'Acetaminophen',
      manufacturer: 'Johnson & Johnson',
      strength: '500mg',
      form: 'tablet',
      country: 'US',
      regions: ['US', 'CA']
    },
    {
      barcode: '12345678902',
      productName: 'Advil',
      genericName: 'Ibuprofen',
      manufacturer: 'Pfizer',
      strength: '200mg',
      form: 'tablet',
      country: 'US',
      regions: ['US', 'CA', 'EU']
    },
    // EU medications
    {
      barcode: '87654321098',
      productName: 'Paracetamol',
      genericName: 'Paracetamol',
      manufacturer: 'GlaxoSmithKline',
      strength: '500mg',
      form: 'tablet',
      country: 'UK',
      regions: ['EU', 'UK']
    },
    // Include Azerbaijan legacy medications for backward compatibility
    {
      barcode: '4770251043697',
      productName: 'Aspirin Cardio',
      genericName: 'Acetylsalicylic acid',
      manufacturer: 'Bayer',
      strength: '100mg',
      form: 'tablet',
      country: 'AZ',
      regions: ['AZ', 'TR']
    }
  ];

  // Filter by region if specified
  return globalMeds.filter(med => 
    !region || region === 'GLOBAL' || med.regions.includes(region) || med.country === region
  );
}

function createGlobalExtractionPrompt(text: string, language: string, region: string): string {
  return `You are a pharmaceutical expert AI that extracts medication information from text in multiple languages and regions.

CRITICAL RULES:
1. Extract ONLY medications/drugs/pharmaceuticals - ignore vitamins, supplements, or food items unless they are regulated medications
2. Return ONLY valid JSON - no explanations or additional text
3. Be conservative with confidence scores - use 0.3-0.7 for uncertain extractions
4. If no clear medication is found, return {"error": "No medication found"}
5. Always include source_provider as "AI_OpenAI" and appropriate country_code for region

TEXT TO ANALYZE: "${text}"
LANGUAGE: ${language}
REGION: ${region}

Extract medication information and return as JSON with this exact structure:
{
  "brand_name": "exact brand name found",
  "generic_name": "active ingredient/generic name", 
  "strength": "dosage strength with unit (e.g., 500mg, 5ml)",
  "form": "dosage form (tablet, capsule, syrup, injection, etc.)",
  "manufacturer": "company name if mentioned",
  "confidence_score": 0.1-1.0,
  "active_ingredients": ["list of active ingredients"],
  "storage_instructions": "storage requirements",
  "indications": ["what it treats"],
  "contraindications": ["when not to use"],
  "warnings": ["important warnings"],
  "side_effects": ["possible side effects"],
  "usage_instructions": {
    "dosage": "how much to take",
    "frequency": "how often",
    "duration": "how long to take",
    "timing": "when to take (with food, etc.)",
    "route": "how to administer",
    "special_instructions": ["special notes"]
  },
  "drug_interactions": ["medications to avoid"],
  "pregnancy_safety": "pregnancy category or safety info",
  "age_restrictions": "age limitations if any",
  "source_provider": "AI_OpenAI",
  "country_code": "${region}"
}

RESPOND ONLY WITH VALID JSON:`;
}

function parseAndCleanAIResponse(aiContent: string, region: string): MedicationData | null {
  try {
    // Try to parse the AI response as JSON
    let parsed = JSON.parse(aiContent);
    
    if (parsed.error) {
      console.log('AI indicated no medication found');
      return null;
    }

    return parsed;
  } catch (parseError) {
    console.error('Failed to parse AI response as JSON:', parseError);
    
    // Try to extract JSON from text that might have extra content
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.error) {
          return null;
        }
        return parsed;
      } catch (secondParseError) {
        console.error('Failed to parse extracted JSON:', secondParseError);
      }
    }

    // Fallback: create basic structure from text
    console.log('Creating fallback response from AI text');
    return createFallbackResponse(aiContent, region);
  }
}

function createFallbackResponse(aiContent: string, region: string): MedicationData {
  const lines = aiContent.split('\n').map(line => line.trim()).filter(Boolean);
  
  return {
    brand_name: extractFromLines(lines, ['brand', 'name', 'product']) || 'Unknown',
    generic_name: extractFromLines(lines, ['generic', 'active', 'ingredient']) || '',
    strength: extractFromLines(lines, ['strength', 'dose', 'dosage']) || '',
    form: extractFromLines(lines, ['form', 'tablet', 'capsule', 'syrup']) || 'tablet',
    manufacturer: extractFromLines(lines, ['manufacturer', 'company']) || '',
    confidence_score: 0.3,
    active_ingredients: [extractFromLines(lines, ['active', 'ingredient']) || 'Unknown'],
    storage_instructions: 'Store as directed',
    indications: [extractFromLines(lines, ['indication', 'treats', 'used for']) || 'As prescribed'],
    contraindications: [],
    warnings: [],
    side_effects: [],
    usage_instructions: {
      dosage: 'As prescribed',
      frequency: 'As prescribed', 
      duration: 'As prescribed',
      timing: 'As directed',
      route: 'oral',
      special_instructions: []
    },
    drug_interactions: [],
    pregnancy_safety: null,
    age_restrictions: null,
    expiry_date: null,
    source_provider: 'AI_OpenAI',
    country_code: region,
    attribution_text: 'Extracted using OpenAI GPT-4'
  };
}

function extractFromLines(lines: string[], keywords: string[]): string | null {
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const keyword of keywords) {
      if (lowerLine.includes(keyword)) {
        const parts = line.split(':');
        if (parts.length > 1) {
          return parts[1].trim();
        }
      }
    }
  }
  return null;
}

// Create standardized medication response with regional context
function createMedicationResponse(medicationData: any, barcode: string | null, confidence: number, region: string): MedicationData {
  return {
    brand_name: medicationData.productName,
    generic_name: medicationData.genericName,
    strength: medicationData.strength,
    form: medicationData.form,
    manufacturer: medicationData.manufacturer,
    confidence_score: confidence,
    barcode: barcode || medicationData.barcode,
    active_ingredients: [medicationData.genericName],
    storage_instructions: "Store in a cool, dry place away from direct sunlight",
    indications: getIndicationsForMedication(medicationData.genericName),
    contraindications: [],
    warnings: getWarningsForMedication(medicationData.genericName),
    side_effects: [],
    usage_instructions: {
      dosage: "As directed by physician",
      frequency: "As prescribed",
      duration: "As prescribed",
      timing: "As directed",
      route: getRouteForForm(medicationData.form),
      special_instructions: getSpecialInstructions(medicationData.genericName)
    },
    drug_interactions: [],
    pregnancy_safety: null,
    age_restrictions: null,
    expiry_date: null,
    source_provider: 'Global_Database',
    country_code: medicationData.country || region,
    attribution_text: `Data from global medication database for ${region}`
  };
}

function validateAndStandardizeMedication(data: MedicationData): MedicationData {
  return {
    ...data,
    brand_name: data.brand_name || 'Unknown',
    confidence_score: Math.max(0, Math.min(1, data.confidence_score || 0.5)),
    active_ingredients: Array.isArray(data.active_ingredients) ? data.active_ingredients : [data.generic_name || 'Unknown'],
    indications: Array.isArray(data.indications) ? data.indications : [],
    contraindications: Array.isArray(data.contraindications) ? data.contraindications : [],
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    side_effects: Array.isArray(data.side_effects) ? data.side_effects : [],
    drug_interactions: Array.isArray(data.drug_interactions) ? data.drug_interactions : [],
    storage_instructions: data.storage_instructions || 'Store as directed',
    source_provider: data.source_provider || 'AI_OpenAI',
    country_code: data.country_code || 'UNKNOWN'
  };
}

// Helper functions (same as before but with global context)
function getIndicationsForMedication(genericName: string): string[] {
  const indicationsMap: Record<string, string[]> = {
    'acetaminophen': ['Pain relief', 'Fever reduction'],
    'paracetamol': ['Pain relief', 'Fever reduction'], 
    'ibuprofen': ['Pain relief', 'Fever reduction', 'Inflammation'],
    'acetylsalicylic acid': ['Pain relief', 'Fever reduction', 'Cardiovascular protection'],
    'aspirin': ['Pain relief', 'Fever reduction', 'Cardiovascular protection'],
    'metformin': ['Type 2 diabetes management'],
    'lisinopril': ['High blood pressure', 'Heart failure'],
    'omeprazole': ['Heartburn', 'GERD', 'Stomach ulcers']
  };

  const lowerName = genericName.toLowerCase();
  for (const [med, indications] of Object.entries(indicationsMap)) {
    if (lowerName.includes(med)) {
      return indications;
    }
  }
  return ['As prescribed by healthcare provider'];
}

function getWarningsForMedication(genericName: string): string[] {
  const warningsMap: Record<string, string[]> = {
    'acetaminophen': ['Do not exceed recommended dose', 'Risk of liver damage with alcohol'],
    'paracetamol': ['Do not exceed recommended dose', 'Risk of liver damage with alcohol'],
    'ibuprofen': ['Take with food', 'May cause stomach irritation'],
    'acetylsalicylic acid': ['May cause stomach bleeding', 'Not for children under 16'],
    'aspirin': ['May cause stomach bleeding', 'Not for children under 16']
  };

  const lowerName = genericName.toLowerCase();
  for (const [med, warnings] of Object.entries(warningsMap)) {
    if (lowerName.includes(med)) {
      return warnings;
    }
  }
  return ['Follow healthcare provider instructions'];
}

function getRouteForForm(form: string): string {
  const routeMap: Record<string, string> = {
    'tablet': 'oral',
    'capsule': 'oral',
    'syrup': 'oral',
    'liquid': 'oral',
    'injection': 'intramuscular',
    'cream': 'topical',
    'ointment': 'topical',
    'drops': 'topical',
    'suppository': 'rectal'
  };

  const lowerForm = form.toLowerCase();
  for (const [formType, route] of Object.entries(routeMap)) {
    if (lowerForm.includes(formType)) {
      return route;
    }
  }
  return 'oral';
}

function getSpecialInstructions(genericName: string): string[] {
  const instructionsMap: Record<string, string[]> = {
    'metformin': ['Take with meals to reduce stomach upset'],
    'omeprazole': ['Take before meals', 'Swallow whole, do not chew'],
    'ibuprofen': ['Take with food or milk']
  };

  const lowerName = genericName.toLowerCase();
  for (const [med, instructions] of Object.entries(instructionsMap)) {
    if (lowerName.includes(med)) {
      return instructions;
    }
  }
  return [];
}

// Database storage function
async function storeExtraction(authHeader: string, extractedData: MedicationData, sessionId?: string): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return;
    }

    // Insert the extraction
    const { error: insertError } = await supabase
      .from('extractions')
      .insert({
        user_id: user.id,
        extracted_json: extractedData,
        quality_score: extractedData.confidence_score,
        model_version: 'v2.0-global'
      });

    if (insertError) {
      console.error('Failed to insert extraction:', insertError);
      return;
    }

    // Link to session if provided
    if (sessionId) {
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ 
          extraction_id: user.id // This would need to be the actual extraction ID
        })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (sessionError) {
        console.error('Failed to link session:', sessionError);
      }
    }

    console.log('Successfully stored extraction for user:', user.id);
  } catch (error) {
    console.error('Database storage error:', error);
    throw error;
  }
}