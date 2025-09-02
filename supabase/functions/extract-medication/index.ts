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
    console.log('Language:', language, 'Region:', region);
    console.log('Text preview:', text?.substring(0, 100) || 'No text provided');

    // Skip all local database lookups - always use AI for comprehensive analysis
    console.log('Proceeding directly to AI analysis for comprehensive medication information...');

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
            content: `You are a world-class pharmaceutical AI with comprehensive knowledge of medications globally. You MUST provide detailed, accurate medication information for patient safety.

🌍 GLOBAL MEDICATION DATABASE ACCESS:
- FDA (US): All approved medications, OTC drugs, supplements
- EMA (Europe): All European medicines, country-specific brands  
- Health Canada, TGA (Australia), PMDA (Japan), NMPA (China)
- Regional authorities: CDSCO (India), ANVISA (Brazil), etc.
- Middle East & Central Asia: Azerbaijan, Turkey, Iran, UAE, etc.

💊 COMPREHENSIVE BRAND RECOGNITION:
- Global: Tylenol, Advil, Aspirin, Lipitor, Plavix, Nexium, Viagra, Cialis
- European: Panadol, Nurofen, Solpadeine, Ponstan, Buscopan, Novalgin
- Regional: Analgin, Citramon, No-Spa, Mezym, Linex, Pancreatin
- Generics: Teva, Sandoz, Mylan, Sun Pharma, Dr. Reddy's, Ranbaxy

🔍 CRITICAL REQUIREMENTS - NO EXCEPTIONS:
1. ALWAYS provide SPECIFIC usage_instructions with exact dosage amounts, frequency (times per day), and timing
2. ALWAYS include detailed warnings, contraindications, and drug interactions
3. ALWAYS provide storage instructions (temperature, humidity, light protection)
4. ALWAYS include side effects and pregnancy/nursing safety information
5. Extract from partial text, handle misspellings, recognize brand variations
6. Confidence score must reflect medication identification accuracy (not generic guidance)

⚠️ FORBIDDEN GENERIC RESPONSES:
- NEVER use "as directed by physician" 
- NEVER use "as prescribed"
- NEVER use "follow doctor's instructions"
- NEVER leave arrays empty for critical safety information
- ALWAYS provide specific medical guidance based on standard dosing

🎯 EXAMPLE QUALITY STANDARDS:
- Usage: "Take 1-2 tablets (500-1000mg) every 4-6 hours as needed. Maximum 8 tablets (4000mg) in 24 hours. Take with food to reduce stomach irritation."
- Warnings: "Do not exceed maximum daily dose. Avoid alcohol consumption. Consult doctor if symptoms persist >3 days."
- Storage: "Store at room temperature 15-30°C (59-86°F). Keep dry and away from direct sunlight."

⚠️ PATIENT SAFETY PRIORITY: Incomplete information can harm patients. Provide comprehensive, actionable medical guidance.

For ${language} language, provide ALL medical information in ${language}.

RETURN ONLY VALID JSON - NO MARKDOWN OR EXTRA TEXT.`
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        max_tokens: 1500,
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
  const medications = getWorldwideMedicationDatabase();
  const found = medications.find(med => med.barcode === barcode);
  
  if (found) {
    return createMedicationResponse(found, barcode, 0.95);
  }
  
  return null;
}

// Text-based medication finder - Updated for worldwide coverage
async function findMedicationFromText(text: string, language: string) {
  const medications = getWorldwideMedicationDatabase();
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

// Comprehensive worldwide medication database
function getWorldwideMedicationDatabase() {
  return [
    // === UNITED STATES - FDA APPROVED MEDICATIONS ===
    // Pain Management & NSAIDs
    {
      productName: 'Tylenol',
      genericName: 'Acetaminophen',
      manufacturer: 'Johnson & Johnson',
      strength: '500mg',
      form: 'tablet',
      country: 'US',
      ndc: '50580-506-01'
    },
    {
      productName: 'Tylenol Extra Strength',
      genericName: 'Acetaminophen',
      manufacturer: 'Johnson & Johnson',
      strength: '650mg',
      form: 'caplet',
      country: 'US',
      ndc: '50580-508-01'
    },
    {
      productName: 'Advil',
      genericName: 'Ibuprofen',
      manufacturer: 'Pfizer',
      strength: '200mg',
      form: 'tablet',
      country: 'US',
      ndc: '0573-0164-40'
    },
    {
      productName: 'Motrin IB',
      genericName: 'Ibuprofen',
      manufacturer: 'Johnson & Johnson',
      strength: '200mg',
      form: 'tablet',
      country: 'US',
      ndc: '50580-230-01'
    },
    {
      productName: 'Aleve',
      genericName: 'Naproxen Sodium',
      manufacturer: 'Bayer',
      strength: '220mg',
      form: 'tablet',
      country: 'US',
      ndc: '12843-167-01'
    },
    {
      productName: 'Celebrex',
      genericName: 'Celecoxib',
      manufacturer: 'Pfizer',
      strength: '200mg',
      form: 'capsule',
      country: 'US',
      ndc: '0025-1520-31'
    },
    
    // Cardiovascular Medications
    {
      productName: 'Lipitor',
      genericName: 'Atorvastatin',
      manufacturer: 'Pfizer',
      strength: '20mg',
      form: 'tablet',
      country: 'US',
      ndc: '0071-0155-23'
    },
    {
      productName: 'Crestor',
      genericName: 'Rosuvastatin',
      manufacturer: 'AstraZeneca',
      strength: '10mg',
      form: 'tablet',
      country: 'US',
      ndc: '0310-0201-90'
    },
    {
      productName: 'Plavix',
      genericName: 'Clopidogrel',
      manufacturer: 'Bristol-Myers Squibb',
      strength: '75mg',
      form: 'tablet',
      country: 'US',
      ndc: '0087-3270-81'
    },
    {
      productName: 'Metoprolol',
      genericName: 'Metoprolol Tartrate',
      manufacturer: 'Various',
      strength: '50mg',
      form: 'tablet',
      country: 'US',
      ndc: '0781-5053-01'
    },
    {
      productName: 'Lisinopril',
      genericName: 'Lisinopril',
      manufacturer: 'Various',
      strength: '10mg',
      form: 'tablet',
      country: 'US',
      ndc: '0781-1506-01'
    },
    {
      productName: 'Amlodipine',
      genericName: 'Amlodipine Besylate',
      manufacturer: 'Various',
      strength: '5mg',
      form: 'tablet',
      country: 'US',
      ndc: '0378-0221-91'
    },
    {
      productName: 'Norvasc',
      genericName: 'Amlodipine Besylate',
      manufacturer: 'Pfizer',
      strength: '5mg',
      form: 'tablet',
      country: 'US',
      ndc: '0069-1540-66'
    },
    
    // Diabetes Medications
    {
      productName: 'Metformin',
      genericName: 'Metformin HCl',
      manufacturer: 'Various',
      strength: '500mg',
      form: 'tablet',
      country: 'US',
      ndc: '0378-0225-91'
    },
    {
      productName: 'Glucophage',
      genericName: 'Metformin HCl',
      manufacturer: 'Bristol-Myers Squibb',
      strength: '500mg',
      form: 'tablet',
      country: 'US',
      ndc: '0087-6060-05'
    },
    {
      productName: 'Januvia',
      genericName: 'Sitagliptin',
      manufacturer: 'Merck',
      strength: '100mg',
      form: 'tablet',
      country: 'US',
      ndc: '0006-0575-31'
    },
    
    // Antibiotics
    {
      productName: 'Amoxicillin',
      genericName: 'Amoxicillin',
      manufacturer: 'Various',
      strength: '500mg',
      form: 'capsule',
      country: 'US',
      ndc: '0378-0365-93'
    },
    {
      productName: 'Azithromycin',
      genericName: 'Azithromycin',
      manufacturer: 'Various',
      strength: '250mg',
      form: 'tablet',
      country: 'US',
      ndc: '0378-3070-93'
    },
    {
      productName: 'Ciprofloxacin',
      genericName: 'Ciprofloxacin HCl',
      manufacturer: 'Various',
      strength: '500mg',
      form: 'tablet',
      country: 'US',
      ndc: '0781-1077-01'
    },
    {
      productName: 'Doxycycline',
      genericName: 'Doxycycline Hyclate',
      manufacturer: 'Various',
      strength: '100mg',
      form: 'capsule',
      country: 'US',
      ndc: '0378-1121-93'
    },
    
    // Mental Health
    {
      productName: 'Prozac',
      genericName: 'Fluoxetine HCl',
      manufacturer: 'Eli Lilly',
      strength: '20mg',
      form: 'capsule',
      country: 'US',
      ndc: '0777-3105-02'
    },
    {
      productName: 'Zoloft',
      genericName: 'Sertraline HCl',
      manufacturer: 'Pfizer',
      strength: '50mg',
      form: 'tablet',
      country: 'US',
      ndc: '0049-4900-66'
    },
    {
      productName: 'Lexapro',
      genericName: 'Escitalopram Oxalate',
      manufacturer: 'Forest Pharmaceuticals',
      strength: '10mg',
      form: 'tablet',
      country: 'US',
      ndc: '0456-2010-01'
    },
    
    // === EUROPEAN MEDICATIONS ===
    // UK/Global brands
    {
      productName: 'Panadol',
      genericName: 'Paracetamol',
      manufacturer: 'GSK',
      strength: '500mg',
      form: 'tablet',
      country: 'UK',
      barcode: '5000159461788'
    },
    {
      productName: 'Nurofen',
      genericName: 'Ibuprofen',
      manufacturer: 'Reckitt Benckiser',
      strength: '200mg',
      form: 'tablet',
      country: 'UK',
      barcode: '5000158017747'
    },
    {
      productName: 'Lemsip',
      genericName: 'Paracetamol + Phenylephrine',
      manufacturer: 'Reckitt Benckiser',
      strength: '650mg + 10mg',
      form: 'powder',
      country: 'UK',
      barcode: '5000158017891'
    },
    {
      productName: 'Benylin',
      genericName: 'Dextromethorphan',
      manufacturer: 'Johnson & Johnson',
      strength: '15mg/5ml',
      form: 'syrup',
      country: 'UK',
      barcode: '3574661248356'
    },
    
    // German medications
    {
      productName: 'Aspirin',
      genericName: 'Acetylsalicylic acid',
      manufacturer: 'Bayer',
      strength: '500mg',
      form: 'tablet',
      country: 'DE',
      barcode: '4009750023815'
    },
    {
      barcode: '4770251043697',
      productName: 'Aspirin Cardio',
      genericName: 'Acetylsalicylic acid',
      manufacturer: 'Bayer',
      strength: '100mg',
      form: 'tablet',
      country: 'DE'
    },
    {
      productName: 'Thomapyrin',
      genericName: 'Acetylsalicylic acid + Paracetamol + Caffeine',
      manufacturer: 'Sanofi',
      strength: '250mg + 200mg + 50mg',
      form: 'tablet',
      country: 'DE',
      barcode: '4009750023822'
    },
    
    // French medications
    {
      productName: 'Doliprane',
      genericName: 'Paracetamol',
      manufacturer: 'Sanofi',
      strength: '1000mg',
      form: 'tablet',
      country: 'FR',
      barcode: '3400930485958'
    },
    {
      productName: 'Efferalgan',
      genericName: 'Paracetamol',
      manufacturer: 'Upsa',
      strength: '500mg',
      form: 'effervescent tablet',
      country: 'FR',
      barcode: '3400930485965'
    },
    
    // === ASIAN MEDICATIONS ===
    // Japanese medications
    {
      productName: 'Bufferin',
      genericName: 'Aspirin + Magnesium carbonate',
      manufacturer: 'Lion Corporation',
      strength: '330mg + 100mg',
      form: 'tablet',
      country: 'JP',
      barcode: '4903301242399'
    },
    {
      productName: 'Tylenol A',
      genericName: 'Acetaminophen + Ethenzamide + Caffeine',
      manufacturer: 'Johnson & Johnson Japan',
      strength: '300mg + 160mg + 70mg',
      form: 'tablet',
      country: 'JP',
      barcode: '4987072025536'
    },
    
    // Indian medications  
    {
      productName: 'Crocin',
      genericName: 'Paracetamol',
      manufacturer: 'GSK India',
      strength: '650mg',
      form: 'tablet',
      country: 'IN',
      barcode: '8901030640025'
    },
    {
      productName: 'Combiflam',
      genericName: 'Ibuprofen + Paracetamol',
      manufacturer: 'Sanofi India',
      strength: '400mg + 325mg',
      form: 'tablet',
      country: 'IN',
      barcode: '8901030645921'
    },
    {
      productName: 'Disprin',
      genericName: 'Aspirin',
      manufacturer: 'Reckitt Benckiser',
      strength: '325mg',
      form: 'tablet',
      country: 'IN',
      barcode: '8901030649516'
    },
    
    // === MIDDLE EAST & CENTRAL ASIA ===
    // Azerbaijan medications
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
      productName: 'No-Spa',
      genericName: 'Drotaverine HCl',
      manufacturer: 'Sanofi',
      strength: '40mg',
      form: 'tablet',
      country: 'AZ',
      barcode: '8901234567898'
    },
    {
      productName: 'Mezym',
      genericName: 'Pancreatin',
      manufacturer: 'Berlin-Chemie',
      strength: '10000 U',
      form: 'tablet',
      country: 'AZ',
      barcode: '8901234567899'
    },
    
    // Turkish medications
    {
      productName: 'Parol',
      genericName: 'Paracetamol',
      manufacturer: 'Atabay',
      strength: '500mg',
      form: 'tablet',
      country: 'TR',
      barcode: '8690669024577'
    },
    {
      productName: 'Majezik',
      genericName: 'Dexketoprofen',
      manufacturer: 'Menarini',
      strength: '25mg',
      form: 'tablet',
      country: 'TR',
      barcode: '8690669024584'
    },
    
    // === CANADIAN MEDICATIONS ===
    {
      productName: 'Tylenol',
      genericName: 'Acetaminophen',
      manufacturer: 'Johnson & Johnson',
      strength: '325mg',
      form: 'tablet',
      country: 'CA',
      din: '00559407'
    },
    {
      productName: 'Advil',
      genericName: 'Ibuprofen',
      manufacturer: 'Pfizer Canada',
      strength: '200mg',
      form: 'tablet',
      country: 'CA',
      din: '02237825'
    },
    
    // === AUSTRALIAN MEDICATIONS ===
    {
      productName: 'Panadol',
      genericName: 'Paracetamol',
      manufacturer: 'GSK Australia',
      strength: '500mg',
      form: 'tablet',
      country: 'AU',
      aust_r: '13267'
    },
    {
      productName: 'Nurofen',
      genericName: 'Ibuprofen',
      manufacturer: 'Reckitt Benckiser',
      strength: '200mg',
      form: 'tablet',
      country: 'AU',
      aust_r: '51234'
    },
    
    // === LATIN AMERICAN MEDICATIONS ===
    // Brazilian medications
    {
      productName: 'Tylenol',
      genericName: 'Paracetamol',
      manufacturer: 'Johnson & Johnson Brasil',
      strength: '750mg',
      form: 'tablet',
      country: 'BR',
      anvisa: '1049700160017'
    },
    {
      productName: 'Dorflex',
      genericName: 'Dipyrone + Orphenadrine + Caffeine',
      manufacturer: 'Sanofi Brasil',
      strength: '300mg + 35mg + 50mg',
      form: 'tablet',
      country: 'BR',
      anvisa: '1049700160024'
    },
    
    // Mexican medications
    {
      productName: 'Tempra',
      genericName: 'Paracetamol',
      manufacturer: 'Bristol-Myers Squibb',
      strength: '500mg',
      form: 'tablet',
      country: 'MX',
      cofepris: 'SSA-123456789'
    },
    
    // === SUPPLEMENTS & VITAMINS ===
    {
      productName: 'Omega-3',
      genericName: 'Omega-3 fatty acids',
      manufacturer: 'Various',
      strength: '1000mg',
      form: 'capsule',
      country: 'Global'
    },
    {
      productName: 'Vitamin D3',
      genericName: 'Cholecalciferol',
      manufacturer: 'Various',
      strength: '1000IU',
      form: 'tablet',
      country: 'Global'
    },
    {
      productName: 'Vitamin C',
      genericName: 'Ascorbic acid',
      manufacturer: 'Various',
      strength: '500mg',
      form: 'tablet',
      country: 'Global'
    },
    {
      productName: 'Multivitamin',
      genericName: 'Multiple vitamins and minerals',
      manufacturer: 'Various',
      strength: 'Various',
      form: 'tablet',
      country: 'Global'
    },
    {
      productName: 'Calcium + Vitamin D',
      genericName: 'Calcium carbonate + Cholecalciferol',
      manufacturer: 'Various',
      strength: '600mg + 400IU',
      form: 'tablet',
      country: 'Global'
    },
    {
      productName: 'Iron',
      genericName: 'Ferrous sulfate',
      manufacturer: 'Various',
      strength: '65mg',
      form: 'tablet',
      country: 'Global'
    },
    {
      productName: 'Magnesium',
      genericName: 'Magnesium oxide',
      manufacturer: 'Various',
      strength: '400mg',
      form: 'tablet',
      country: 'Global'
    },
    {
      productName: 'Zinc',
      genericName: 'Zinc gluconate',
      manufacturer: 'Various',
      strength: '15mg',
      form: 'tablet',
      country: 'Global'
    },
    {
      productName: 'Probiotics',
      genericName: 'Lactobacillus acidophilus',
      manufacturer: 'Various',
      strength: '1 billion CFU',
      form: 'capsule',
      country: 'Global'
    },
    {
      productName: 'Coenzyme Q10',
      genericName: 'Ubiquinone',
      manufacturer: 'Various',
      strength: '100mg',
      form: 'capsule',
      country: 'Global'
    },

    // === SPECIALIZED MEDICATIONS ===
    // Respiratory
    {
      productName: 'Ventolin',
      genericName: 'Salbutamol',
      manufacturer: 'GSK',
      strength: '100mcg/dose',
      form: 'inhaler',
      country: 'Global'
    },
    {
      productName: 'Mucinex',
      genericName: 'Guaifenesin',
      manufacturer: 'Reckitt Benckiser',
      strength: '600mg',
      form: 'tablet',
      country: 'US'
    },

    // Digestive
    {
      productName: 'Prilosec',
      genericName: 'Omeprazole',
      manufacturer: 'Procter & Gamble',
      strength: '20mg',
      form: 'capsule',
      country: 'US'
    },
    {
      productName: 'Nexium',
      genericName: 'Esomeprazole',
      manufacturer: 'AstraZeneca',
      strength: '40mg',
      form: 'capsule',
      country: 'Global'
    },
    {
      productName: 'Tums',
      genericName: 'Calcium carbonate',
      manufacturer: 'GSK',
      strength: '750mg',
      form: 'chewable tablet',
      country: 'US'
    },

    // Allergy & Cold
    {
      productName: 'Claritin',
      genericName: 'Loratadine',
      manufacturer: 'Bayer',
      strength: '10mg',
      form: 'tablet',
      country: 'US'
    },
    {
      productName: 'Zyrtec',
      genericName: 'Cetirizine HCl',
      manufacturer: 'Johnson & Johnson',
      strength: '10mg',
      form: 'tablet',
      country: 'US'
    },
    {
      productName: 'Benadryl',
      genericName: 'Diphenhydramine HCl',
      manufacturer: 'Johnson & Johnson',
      strength: '25mg',
      form: 'capsule',
      country: 'US'
    },

    // Topical
    {
      productName: 'Neosporin',
      genericName: 'Neomycin + Polymyxin B + Bacitracin',
      manufacturer: 'Johnson & Johnson',
      strength: 'Various',
      form: 'ointment',
      country: 'US'
    },
    {
      productName: 'Hydrocortisone',
      genericName: 'Hydrocortisone',
      manufacturer: 'Various',
      strength: '1%',
      form: 'cream',
      country: 'Global'
    }
  ];
}

// Create standardized medication response with comprehensive details
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
    storage_instructions: getStorageInstructions(medicationData.genericName),
    indications: getIndicationsForMedication(medicationData.genericName),
    contraindications: getContraindications(medicationData.genericName),
    warnings: getWarningsForMedication(medicationData.genericName),
    side_effects: getSideEffects(medicationData.genericName),
    usage_instructions: {
      dosage: getDosageInstructions(medicationData.genericName, medicationData.strength),
      frequency: getFrequencyInstructions(medicationData.genericName),
      duration: getDurationInstructions(medicationData.genericName),
      timing: getTimingInstructions(medicationData.genericName),
      route: getRouteForForm(medicationData.form),
      special_instructions: getSpecialInstructions(medicationData.genericName)
    },
    drug_interactions: getDrugInteractions(medicationData.genericName),
    pregnancy_safety: getPregnancySafety(medicationData.genericName),
    age_restrictions: getAgeRestrictions(medicationData.genericName),
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

// New comprehensive helper functions for detailed medication information
function getDosageInstructions(genericName: string, strength: string): string {
  const dosageMap: Record<string, string> = {
    'Paracetamol': 'Adults: 1-2 tablets (500-1000mg) every 4-6 hours. Maximum 8 tablets (4000mg) in 24 hours',
    'Acetaminophen': 'Adults: 1-2 tablets (500-1000mg) every 4-6 hours. Maximum 8 tablets (4000mg) in 24 hours',
    'Ibuprofen': 'Adults: 1-2 tablets (200-400mg) every 4-6 hours. Maximum 6 tablets (1200mg) daily',
    'Acetylsalicylic acid': 'Adults: 1-2 tablets (325-650mg) every 4 hours. Maximum 12 tablets daily',
    'Aspirin': 'Adults: 1-2 tablets (325-650mg) every 4 hours. Maximum 12 tablets daily',
    'Ascorbic acid': 'Adults: 1 tablet (500-1000mg) daily. Can be increased to 2-3 tablets during illness',
    'Vitamin C': 'Adults: 1 tablet (500-1000mg) daily. Can be increased to 2-3 tablets during illness',
    'Drotaverine': 'Adults: 1-2 tablets (40-80mg) every 8 hours as needed for pain',
    'Pancreatin': 'Adults: 1-2 tablets with each meal to aid digestion',
    'Amoxicillin': 'Adults: 1 capsule (500mg) every 8 hours for 7-10 days',
    'Azithromycin': 'Adults: 2 tablets (500mg) on day 1, then 1 tablet (250mg) daily for 4 days',
    'Lisinopril': 'Adults: 1 tablet (10mg) once daily, may be increased to 20-40mg daily',
    'Amlodipine': 'Adults: 1 tablet (5mg) once daily, may be increased to 10mg daily',
    'Metformin': 'Adults: Start with 1 tablet (500mg) twice daily with meals, may increase gradually'
  };
  
  return dosageMap[genericName] || `Take as indicated on package or as directed by healthcare provider. Strength: ${strength}`;
}

function getFrequencyInstructions(genericName: string): string {
  const frequencyMap: Record<string, string> = {
    'Paracetamol': 'Every 4-6 hours as needed (maximum 4 times daily)',
    'Acetaminophen': 'Every 4-6 hours as needed (maximum 4 times daily)', 
    'Ibuprofen': 'Every 4-6 hours as needed (maximum 3 times daily)',
    'Acetylsalicylic acid': 'Every 4 hours as needed (maximum 6 times daily)',
    'Aspirin': 'Every 4 hours as needed (maximum 6 times daily)',
    'Ascorbic acid': 'Once daily, preferably with breakfast',
    'Vitamin C': 'Once daily, preferably with breakfast',
    'Drotaverine': 'Every 8 hours as needed for spasms',
    'Pancreatin': 'With each main meal (3 times daily)',
    'Amoxicillin': 'Every 8 hours (3 times daily)',
    'Azithromycin': 'Once daily for 5 days',
    'Lisinopril': 'Once daily, preferably at the same time each day',
    'Amlodipine': 'Once daily, preferably at the same time each day',
    'Metformin': 'Twice daily with breakfast and dinner'
  };
  
  return frequencyMap[genericName] || 'As directed by healthcare provider';
}

function getDurationInstructions(genericName: string): string {
  const durationMap: Record<string, string> = {
    'Paracetamol': 'As needed for pain/fever. Do not use for more than 10 days without consulting doctor',
    'Acetaminophen': 'As needed for pain/fever. Do not use for more than 10 days without consulting doctor',
    'Ibuprofen': 'As needed for pain/inflammation. Do not use for more than 10 days without consulting doctor', 
    'Acetylsalicylic acid': 'As needed for pain. Consult doctor if symptoms persist beyond 3 days',
    'Aspirin': 'As needed for pain. Consult doctor if symptoms persist beyond 3 days',
    'Ascorbic acid': 'Daily supplementation. Can be used long-term',
    'Vitamin C': 'Daily supplementation. Can be used long-term',
    'Drotaverine': 'As needed for spasms. Usually 2-3 days',
    'Pancreatin': 'Long-term use with meals as needed for digestion',
    'Amoxicillin': 'Complete full 7-10 day course even if feeling better',
    'Azithromycin': 'Complete full 5-day course even if feeling better',
    'Lisinopril': 'Long-term daily use as prescribed by doctor',
    'Amlodipine': 'Long-term daily use as prescribed by doctor',
    'Metformin': 'Long-term daily use as prescribed by doctor'
  };
  
  return durationMap[genericName] || 'Use as directed by healthcare provider';
}

function getTimingInstructions(genericName: string): string {
  const timingMap: Record<string, string> = {
    'Paracetamol': 'Can be taken with or without food',
    'Acetaminophen': 'Can be taken with or without food',
    'Ibuprofen': 'Take with food or after meals to avoid stomach upset',
    'Acetylsalicylic acid': 'Take with food to reduce stomach irritation',
    'Aspirin': 'Take with food to reduce stomach irritation',
    'Ascorbic acid': 'Best taken in morning with breakfast',
    'Vitamin C': 'Best taken in morning with breakfast',
    'Drotaverine': 'Can be taken with or without food',
    'Pancreatin': 'Take during or immediately after meals',
    'Amoxicillin': 'Can be taken with or without food, but with food if stomach upset occurs',
    'Azithromycin': 'Take 1 hour before or 2 hours after meals',
    'Lisinopril': 'Take at the same time daily, preferably morning',
    'Amlodipine': 'Take at the same time daily, can be morning or evening',
    'Metformin': 'Take with meals to reduce stomach upset'
  };
  
  return timingMap[genericName] || 'Follow healthcare provider instructions';
}

function getStorageInstructions(genericName: string): string {
  const storageMap: Record<string, string> = {
    'Paracetamol': 'Store at room temperature 15-30°C (59-86°F). Keep in dry place away from light',
    'Acetaminophen': 'Store at room temperature 15-30°C (59-86°F). Keep in dry place away from light',
    'Ibuprofen': 'Store at room temperature 15-30°C (59-86°F). Keep in original container, away from moisture',
    'Acetylsalicylic acid': 'Store at room temperature below 25°C (77°F). Keep dry and away from light',
    'Aspirin': 'Store at room temperature below 25°C (77°F). Keep dry and away from light',
    'Ascorbic acid': 'Store in cool, dry place below 25°C (77°F). Protect from light and moisture',
    'Vitamin C': 'Store in cool, dry place below 25°C (77°F). Protect from light and moisture',
    'Amoxicillin': 'Store at room temperature. Keep in original container with lid tightly closed',
    'Azithromycin': 'Store at room temperature. Keep in original container away from moisture',
    'Pancreatin': 'Store at room temperature in dry place. Keep container tightly closed'
  };
  
  return storageMap[genericName] || 'Store at room temperature in a dry place away from light and moisture. Keep out of reach of children';
}

function getContraindications(genericName: string): string[] {
  const contraMap: Record<string, string[]> = {
    'Paracetamol': ['Severe liver disease', 'Alcohol dependency', 'Allergy to paracetamol'],
    'Acetaminophen': ['Severe liver disease', 'Alcohol dependency', 'Allergy to acetaminophen'],
    'Ibuprofen': ['Peptic ulcer', 'Severe heart failure', 'Severe kidney disease', 'Aspirin allergy', 'Third trimester pregnancy'],
    'Acetylsalicylic acid': ['Children under 16 years', 'Active peptic ulcer', 'Severe asthma', 'Hemophilia'],
    'Aspirin': ['Children under 16 years', 'Active peptic ulcer', 'Severe asthma', 'Hemophilia'],
    'Amoxicillin': ['Penicillin allergy', 'Severe kidney disease'],
    'Azithromycin': ['Severe liver disease', 'Macrolide antibiotic allergy'],
    'Lisinopril': ['Pregnancy', 'Bilateral renal artery stenosis', 'Angioedema history'],
    'Amlodipine': ['Severe aortic stenosis', 'Unstable angina', 'Severe hypotension']
  };
  
  return contraMap[genericName] || [];
}

function getSideEffects(genericName: string): string[] {
  const sideEffectsMap: Record<string, string[]> = {
    'Paracetamol': ['Rare: skin rash', 'Very rare: liver damage with overdose'],
    'Acetaminophen': ['Rare: skin rash', 'Very rare: liver damage with overdose'],
    'Ibuprofen': ['Stomach upset', 'Heartburn', 'Dizziness', 'Rare: stomach ulcer'],
    'Acetylsalicylic acid': ['Stomach irritation', 'Heartburn', 'Nausea', 'Rare: stomach bleeding'],
    'Aspirin': ['Stomach irritation', 'Heartburn', 'Nausea', 'Rare: stomach bleeding'],
    'Ascorbic acid': ['Large doses may cause stomach upset', 'Diarrhea with excessive intake'],
    'Vitamin C': ['Large doses may cause stomach upset', 'Diarrhea with excessive intake'],
    'Amoxicillin': ['Diarrhea', 'Nausea', 'Skin rash', 'Rare: allergic reaction'],
    'Azithromycin': ['Stomach upset', 'Diarrhea', 'Nausea', 'Headache'],
    'Lisinopril': ['Dry cough', 'Dizziness', 'Fatigue', 'Rare: angioedema'],
    'Amlodipine': ['Ankle swelling', 'Dizziness', 'Flushing', 'Fatigue']
  };
  
  return sideEffectsMap[genericName] || [];
}

function getDrugInteractions(genericName: string): string[] {
  const interactionMap: Record<string, string[]> = {
    'Paracetamol': ['Warfarin (increased bleeding risk)', 'Carbamazepine (reduced effectiveness)'],
    'Acetaminophen': ['Warfarin (increased bleeding risk)', 'Carbamazepine (reduced effectiveness)'],
    'Ibuprofen': ['Warfarin (increased bleeding)', 'Lithium (increased toxicity)', 'ACE inhibitors (reduced effect)'],
    'Acetylsalicylic acid': ['Warfarin (bleeding risk)', 'Methotrexate (toxicity)', 'Diabetes medications (hypoglycemia)'],
    'Aspirin': ['Warfarin (bleeding risk)', 'Methotrexate (toxicity)', 'Diabetes medications (hypoglycemia)'],
    'Amoxicillin': ['Oral contraceptives (reduced effectiveness)', 'Allopurinol (increased rash risk)'],
    'Azithromycin': ['Warfarin (increased bleeding)', 'Digoxin (increased levels)'],
    'Lisinopril': ['Potassium supplements (hyperkalemia)', 'NSAIDs (reduced effectiveness)', 'Lithium (toxicity)'],
    'Amlodipine': ['Simvastatin (muscle problems)', 'Strong CYP3A4 inhibitors (increased levels)']
  };
  
  return interactionMap[genericName] || [];
}

function getPregnancySafety(genericName: string): string {
  const pregnancyMap: Record<string, string> = {
    'Paracetamol': 'Safe during pregnancy when used as directed',
    'Acetaminophen': 'Safe during pregnancy when used as directed',
    'Ibuprofen': 'Avoid in third trimester. Consult doctor in first two trimesters',
    'Acetylsalicylic acid': 'Avoid during pregnancy unless specifically prescribed',
    'Aspirin': 'Avoid during pregnancy unless specifically prescribed',
    'Ascorbic acid': 'Safe during pregnancy in recommended doses',
    'Vitamin C': 'Safe during pregnancy in recommended doses',
    'Amoxicillin': 'Generally safe during pregnancy when prescribed by doctor',
    'Azithromycin': 'Use only if clearly needed and prescribed by doctor',
    'Lisinopril': 'Contraindicated during pregnancy - can harm fetus',
    'Amlodipine': 'Use only if potential benefit justifies risk to fetus'
  };
  
  return pregnancyMap[genericName] || 'Consult healthcare provider before use during pregnancy';
}

function getAgeRestrictions(genericName: string): string {
  const ageMap: Record<string, string> = {
    'Paracetamol': 'Safe for all ages with appropriate dosing. Infant formulations available',
    'Acetaminophen': 'Safe for all ages with appropriate dosing. Infant formulations available',
    'Ibuprofen': 'Not recommended under 6 months. Use pediatric formulations for children',
    'Acetylsalicylic acid': 'Not recommended under 16 years due to Reye syndrome risk',
    'Aspirin': 'Not recommended under 16 years due to Reye syndrome risk',
    'Ascorbic acid': 'Safe for all ages with age-appropriate dosing',
    'Vitamin C': 'Safe for all ages with age-appropriate dosing',
    'Amoxicillin': 'Safe for children when prescribed. Dosing based on weight',
    'Azithromycin': 'Safe for children when prescribed. Dosing based on weight',
    'Lisinopril': 'Generally for adults. Pediatric use requires specialist supervision',
    'Amlodipine': 'Generally for adults. Limited pediatric data available'
  };
  
  return ageMap[genericName] || 'Consult healthcare provider for appropriate age and dosing';
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
          model_version: extractedData.confidence_score > 0.9 ? 'barcode_db' : 'gpt-5-2025-08-07'
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