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
    const { text, language = 'EN', region = 'US', barcode = null, sessionId = null } = await req.json();
    
    if (!text && !barcode) {
      return new Response(
        JSON.stringify({ error: 'Text or barcode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing request - text length:', text?.length || 0, 'barcode:', barcode);

    // Try barcode lookup first if barcode is provided
    if (barcode) {
      const knownMedications = await getKnownMedicationByBarcode(barcode);
      if (knownMedications) {
        console.log('Found medication by barcode:', barcode);
        
        // Store in database if user is authenticated
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
          await storeExtraction(authHeader, knownMedications, sessionId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: knownMedications,
            source: 'barcode_database'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Try text-based medication lookup from common Azerbaijan medications
    if (text) {
      const textBasedMedication = await findMedicationFromText(text, language);
      if (textBasedMedication) {
        console.log('Found medication from text analysis:', textBasedMedication.brand_name);
        
        // Store in database if user is authenticated
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
          await storeExtraction(authHeader, textBasedMedication, sessionId);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: textBasedMedication,
            source: 'text_database'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create language-aware extraction prompt
    const getLanguageSpecificPrompt = (language: string, region: string) => {
      const languageInstructions = {
        'AZ': 'Məlumatları Azərbaycan dilində qaytarın. Tibbi terminologiya və təlimatlar Azərbaycan dilində olmalıdır.',
        'RU': 'Верните информацию на русском языке. Медицинская терминология и инструкции должны быть на русском языке.',
        'TR': 'Bilgileri Türkçe olarak döndürün. Tıbbi terminoloji ve talimatlar Türkçe olmalıdır.',
        'EN': 'Return information in English. Medical terminology and instructions should be in English.'
      };

      const languageInstruction = languageInstructions[language] || languageInstructions['EN'];
      
      return `Extract comprehensive medication information from this text and return it in the specified language. ${languageInstruction}

Return ONLY a valid JSON object with the following structure:
{
  "brand_name": "string (required) - in ${language}",
  "generic_name": "string or null - in ${language}",
  "strength": "string or null", 
  "form": "string or null (tablet, capsule, syrup, etc) - in ${language}",
  "manufacturer": "string or null - in ${language}",
  "indications": ["string array of uses/conditions - in ${language}"],
  "contraindications": ["string array of who should not use - in ${language}"],
  "warnings": ["string array of warnings - in ${language}"],
  "side_effects": ["string array of side effects - in ${language}"],
  "active_ingredients": ["string array - in ${language}"],
  "usage_instructions": {
    "dosage": "string - how much to take - in ${language}",
    "frequency": "string - how often (daily, twice daily, etc) - in ${language}",
    "duration": "string - how long to take (days, weeks, or ongoing) - in ${language}",
    "timing": "string - when to take (morning, evening, with meals, etc) - in ${language}",
    "route": "string - how to take (oral, topical, etc) - in ${language}",
    "special_instructions": "string - any special instructions - in ${language}"
  },
  "storage_instructions": "string - how to store the medication - in ${language}",
  "drug_interactions": ["string array of known interactions - in ${language}"],
  "pregnancy_safety": "string or null - safety during pregnancy - in ${language}",
  "age_restrictions": "string or null - age limitations - in ${language}",
  "expiry_date": "YYYY-MM-DD or null",
  "barcode": "string or null",
  "confidence_score": number between 0.0 and 1.0
}

Text to analyze (Language: ${language}, Region: ${region}):
${text}

Important: All text fields (except dates, barcodes, and confidence_score) must be in ${language} language. Respond with ONLY the JSON object, no additional text.`;
    };

    const extractionPrompt = getLanguageSpecificPrompt(language, region);

    console.log('Sending extraction request to OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a medical information extraction specialist for Azerbaijan pharmaceutical market. Extract medication data accurately and return only valid JSON. Adapt your response to the user's language and region. For ${language} language, ensure all text fields are in ${language} language where appropriate. 

You have extensive knowledge of Azerbaijan medications including brands like: Aspirin Cardio, Lisinopril-Teva, Paracetamol, Nurofen, Analgin, Citramon, No-Spa, Mezym, Linex, Ibuprofen, and many others commonly available in Azerbaijan pharmacies.

When extracting medication information, be very generous in identifying medications even from partial text. Look for:
- Brand names (even if slightly misspelled)
- Generic/active ingredient names
- Dosage information (mg, ml, etc.)
- Common medication forms (tablet, capsule, syrup, cream)
- Manufacturer names (Bayer, Teva, Nobel İlaç, etc.)

If you can identify ANY medication information from the text, return a proper medication entry with high confidence rather than marking it as unknown.

IMPORTANT: You must respond with ONLY valid JSON, no markdown formatting, no additional text, just the JSON object.`
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        max_completion_tokens: 1500,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Check if the response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', JSON.stringify(data));
      throw new Error('Invalid response structure from OpenAI');
    }
    
    const extractedText = data.choices[0].message.content;
    console.log('OpenAI response received (first 200 chars):', extractedText?.substring(0, 200) + '...');

    // Parse the JSON response
    let extractedData;
    try {
      if (!extractedText || extractedText.trim() === '') {
        throw new Error('Empty response from OpenAI');
      }
      
      // Clean the response - remove any markdown formatting
      let cleanedText = extractedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      console.log('Attempting to parse cleaned JSON (first 200 chars):', cleanedText.substring(0, 200) + '...');
      extractedData = JSON.parse(cleanedText);
      console.log('Successfully parsed JSON response');
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON. Raw response:', extractedText);
      console.error('Parse error:', parseError.message);
      
      // Fallback: create a generic medication entry
      extractedData = {
        brand_name: text ? `Medication from Scan: ${text.substring(0, 50)}` : 'Unidentified Medication',
        generic_name: null,
        strength: null,
        form: null,
        manufacturer: null,
        confidence_score: 0.1,
        barcode: barcode,
        active_ingredients: [],
        indications: [],
        contraindications: [],
        warnings: ['Please consult with healthcare provider'],
        side_effects: [],
        usage_instructions: {
          dosage: 'As prescribed by physician',
          frequency: 'As prescribed',
          duration: 'As prescribed',
          timing: 'As directed',
          route: 'As directed',
          special_instructions: 'Follow healthcare provider instructions'
        },
        storage_instructions: 'Store as directed on package',
        drug_interactions: [],
        pregnancy_safety: null,
        age_restrictions: null,
        expiry_date: null
      };
      console.log('Created fallback medication entry');
    }

    // Validate required fields - be more descriptive for unknown medications
    if (!extractedData.brand_name) {
      extractedData.confidence_score = 0.1;
      if (barcode) {
        extractedData.brand_name = `Unidentified Medication (${barcode})`;
      } else {
        extractedData.brand_name = 'Unidentified Medication from Scan';
      }
    }

    // Ensure confidence score exists
    if (typeof extractedData.confidence_score !== 'number') {
      extractedData.confidence_score = 0.5;
    }

    console.log('Final extracted data:', JSON.stringify({
      brand_name: extractedData.brand_name,
      confidence_score: extractedData.confidence_score,
      source: 'ai_extraction'
    }));

    // Store in database if user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      await storeExtraction(authHeader, extractedData, sessionId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        source: 'ai_extraction'
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

// Known medication database lookup function
async function getKnownMedicationByBarcode(barcode: string) {
  const medications = getAzerbaijanMedicationDatabase();
  const found = medications.find(med => med.barcode === barcode);
  
  if (found) {
    return createMedicationResponse(found, barcode, 0.95);
  }
  
  return null;
}

// Text-based medication finder
async function findMedicationFromText(text: string, language: string) {
  const medications = getAzerbaijanMedicationDatabase();
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
  
  // Try strength-based matching for common medications
  if (!found) {
    const strengthMatch = searchText.match(/(\d+)\s*(mg|ml|g)/i);
    if (strengthMatch) {
      const strength = strengthMatch[1] + strengthMatch[2].toLowerCase();
      found = medications.find(med => 
        med.strength.toLowerCase().includes(strength) &&
        (searchText.includes('paracetamol') || searchText.includes('ibuprofen') || 
         searchText.includes('aspirin') || searchText.includes('analgin'))
      );
    }
  }
  
  if (found) {
    return createMedicationResponse(found, null, 0.85);
  }
  
  return null;
}

// Comprehensive Azerbaijan medication database
function getAzerbaijanMedicationDatabase() {
  return [
    // Pain relievers & fever reducers
    {
      barcode: '4770251043697',
      productName: 'Aspirin Cardio',
      genericName: 'Acetylsalicylic acid',
      manufacturer: 'Bayer',
      strength: '100mg',
      form: 'tablet',
      country: 'AZ'
    },
    {
      barcode: '8901391509173',
      productName: 'Aspirin C',
      genericName: 'Acetylsalicylic acid + Ascorbic acid',
      manufacturer: 'Bayer',
      strength: '400mg + 240mg',
      form: 'effervescent tablet',
      country: 'AZ'
    },
    {
      barcode: '7901234567892',
      productName: 'Paracetamol',
      genericName: 'Paracetamol',
      manufacturer: 'Nobel İlaç',
      strength: '500mg',
      form: 'tablet',
      country: 'AZ'
    },
    {
      barcode: '7901234567893',
      productName: 'Paracetamol',
      genericName: 'Paracetamol',
      manufacturer: 'Nobel İlaç',
      strength: '125mg',
      form: 'suppository',
      country: 'AZ'
    },
    {
      barcode: '5901234567894',
      productName: 'Nurofen',
      genericName: 'Ibuprofen',
      manufacturer: 'Reckitt Benckiser',
      strength: '200mg',
      form: 'tablet',
      country: 'AZ'
    },
    {
      barcode: '5901234567895',
      productName: 'Nurofen Forte',
      genericName: 'Ibuprofen',
      manufacturer: 'Reckitt Benckiser',
      strength: '400mg',
      form: 'tablet',
      country: 'AZ'
    },
    {
      barcode: '6901234567896',
      productName: 'Analgin',
      genericName: 'Metamizole sodium',
      manufacturer: 'Tatkhimfarmpreparaty',
      strength: '500mg',
      form: 'tablet',
      country: 'AZ'
    },
    {
      barcode: '6901234567897',
      productName: 'Citramon',
      genericName: 'Paracetamol + Acetylsalicylic acid + Caffeine',
      manufacturer: 'Pharmstandard',
      strength: '240mg + 240mg + 30mg',
      form: 'tablet',
      country: 'AZ'
    },
    // Cardiovascular medications
    {
      barcode: '5901234567890',
      productName: 'Lisinopril-Teva',
      genericName: 'Lisinopril',
      manufacturer: 'Teva',
      strength: '10mg',
      form: 'tablet',
      country: 'AZ'
    },
    {
      barcode: '5901234567891',
      productName: 'Amlodipine',
      genericName: 'Amlodipine',
      manufacturer: 'Pfizer',
      strength: '5mg',
      form: 'tablet',
      country: 'AZ'
    },
    // Digestive system
    {
      barcode: '8901234567898',
      productName: 'No-Spa',
      genericName: 'Drotaverine',
      manufacturer: 'Sanofi',
      strength: '40mg',
      form: 'tablet',
      country: 'AZ'
    },
    {
      barcode: '8901234567899',
      productName: 'Mezym',
      genericName: 'Pancreatin',
      manufacturer: 'Berlin-Chemie',
      strength: '10000 U',
      form: 'tablet',
      country: 'AZ'
    },
    {
      barcode: '8901234567800',
      productName: 'Linex',
      genericName: 'Lactobacillus acidophilus',
      manufacturer: 'Lek',
      strength: '280mg',
      form: 'capsule',
      country: 'AZ'
    },
    // Antibiotics
    {
      barcode: '9901234567801',
      productName: 'Amoxicillin',
      genericName: 'Amoxicillin',
      manufacturer: 'Sandoz',
      strength: '500mg',
      form: 'capsule',
      country: 'AZ'
    },
    {
      barcode: '9901234567802',
      productName: 'Azithromycin',
      genericName: 'Azithromycin',
      manufacturer: 'Pfizer',
      strength: '250mg',
      form: 'tablet',
      country: 'AZ'
    }
  ];
}

// Create standardized medication response
function createMedicationResponse(medicationData: any, barcode: string | null, confidence: number) {
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
    expiry_date: null
  };
}

// Helper functions for medication data
function getIndicationsForMedication(genericName: string): string[] {
  const indications: Record<string, string[]> = {
    'Paracetamol': ['Pain relief', 'Fever reduction'],
    'Ibuprofen': ['Pain relief', 'Inflammation reduction', 'Fever reduction'],
    'Acetylsalicylic acid': ['Pain relief', 'Inflammation reduction', 'Cardiovascular protection'],
    'Lisinopril': ['High blood pressure', 'Heart failure'],
    'Amlodipine': ['High blood pressure', 'Chest pain (angina)'],
    'Drotaverine': ['Smooth muscle spasms', 'Abdominal pain'],
    'Pancreatin': ['Digestive enzyme deficiency', 'Pancreatic insufficiency'],
    'Lactobacillus acidophilus': ['Intestinal flora restoration', 'Digestive health'],
    'Amoxicillin': ['Bacterial infections'],
    'Azithromycin': ['Bacterial infections', 'Respiratory tract infections']
  };
  
  return indications[genericName] || ['As prescribed by physician'];
}

function getWarningsForMedication(genericName: string): string[] {
  const warnings: Record<string, string[]> = {
    'Paracetamol': ['Do not exceed recommended dose - risk of liver damage'],
    'Ibuprofen': ['Take with food to avoid stomach irritation'],
    'Acetylsalicylic acid': ['Risk of stomach bleeding', 'Not suitable for children under 16'],
    'Amoxicillin': ['Complete the full course even if feeling better'],
    'Azithromycin': ['Take as prescribed - do not skip doses']
  };
  
  return warnings[genericName] || [];
}

function getRouteForForm(form: string): string {
  const routes: Record<string, string> = {
    'tablet': 'Oral',
    'capsule': 'Oral',
    'syrup': 'Oral',
    'suppository': 'Rectal',
    'cream': 'Topical',
    'ointment': 'Topical'
  };
  
  return routes[form] || 'As directed';
}

function getSpecialInstructions(genericName: string): string {
  const instructions: Record<string, string> = {
    'Ibuprofen': 'Take with food or milk',
    'Paracetamol': 'Take with water',
    'Acetylsalicylic acid': 'Take with food',
    'Pancreatin': 'Take with meals',
    'Lactobacillus acidophilus': 'Take with or after meals'
  };
  
  return instructions[genericName] || 'Take with water';
}

// Helper function to store extraction in database
async function storeExtraction(authHeader: string, extractedData: any, sessionId?: string) {
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
      // Insert extraction
      const { data: extraction, error: dbError } = await supabase
        .from('extractions')
        .insert({
          user_id: user.user.id,
          extracted_json: extractedData,
          quality_score: extractedData.confidence_score,
          model_version: extractedData.confidence_score > 0.9 ? 'barcode_db' : 'gpt-4.1-2025-04-14'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        return null;
      } else {
        console.log('Extraction saved to database');
        
        // Link extraction to session if sessionId provided
        if (sessionId && extraction) {
          const { error: sessionError } = await supabase
            .from('sessions')
            .update({ extraction_id: extraction.id })
            .eq('id', sessionId)
            .eq('user_id', user.user.id);
            
          if (sessionError) {
            console.error('Failed to link extraction to session:', sessionError);
          } else {
            console.log('Extraction linked to session');
          }
        }
        
        return extraction.id;
      }
    }
  } catch (dbError) {
    console.error('Database operation failed:', dbError);
  }
  return null;
}