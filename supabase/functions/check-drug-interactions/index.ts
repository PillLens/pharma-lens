import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: 'major' | 'moderate' | 'minor';
  description: string;
  management: string;
  evidenceLevel: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { medications } = await req.json();

    if (!medications || medications.length < 2) {
      return new Response(
        JSON.stringify({
          interactions: [],
          source: 'none',
          lastUpdated: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // In a real implementation, you would call external APIs here
    // For now, we'll return mock data based on common interactions
    const interactions = await checkCommonInteractions(medications);

    return new Response(
      JSON.stringify({
        interactions,
        source: 'external_api_mock',
        lastUpdated: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function checkCommonInteractions(medications: string[]): Promise<DrugInteraction[]> {
  const interactions: DrugInteraction[] = [];
  const medLower = medications.map(med => med.toLowerCase());

  // Define known high-risk interactions
  const knownInteractions = [
    {
      drugs: ['warfarin', 'aspirin'],
      severity: 'major' as const,
      description: 'Increased bleeding risk when combining warfarin with aspirin',
      management: 'Monitor INR closely and watch for bleeding signs. Consider gastroprotection.',
      evidenceLevel: 'High'
    },
    {
      drugs: ['metformin', 'contrast'],
      severity: 'major' as const,
      description: 'Risk of lactic acidosis with metformin and iodinated contrast agents',
      management: 'Discontinue metformin 48 hours before and after contrast procedures.',
      evidenceLevel: 'High'
    },
    {
      drugs: ['digoxin', 'amiodarone'],
      severity: 'major' as const,
      description: 'Amiodarone significantly increases digoxin plasma levels',
      management: 'Reduce digoxin dose by 50% when starting amiodarone. Monitor levels.',
      evidenceLevel: 'High'
    },
    {
      drugs: ['simvastatin', 'clarithromycin'],
      severity: 'major' as const,
      description: 'Increased risk of rhabdomyolysis due to elevated statin levels',
      management: 'Avoid combination. Use alternative antibiotic or statin.',
      evidenceLevel: 'High'
    },
    {
      drugs: ['lisinopril', 'spironolactone'],
      severity: 'moderate' as const,
      description: 'Risk of hyperkalemia when combining ACE inhibitors with K-sparing diuretics',
      management: 'Monitor serum potassium regularly, especially in elderly patients.',
      evidenceLevel: 'Moderate'
    },
    {
      drugs: ['omeprazole', 'clopidogrel'],
      severity: 'moderate' as const,
      description: 'Omeprazole may reduce antiplatelet effect of clopidogrel',
      management: 'Consider pantoprazole as alternative PPI if both drugs needed.',
      evidenceLevel: 'Moderate'
    },
    {
      drugs: ['amlodipine', 'simvastatin'],
      severity: 'minor' as const,
      description: 'Amlodipine may increase simvastatin exposure',
      management: 'Monitor for muscle symptoms. Consider dose adjustment if needed.',
      evidenceLevel: 'Low'
    }
  ];

  // Check each pair of medications
  for (let i = 0; i < medLower.length; i++) {
    for (let j = i + 1; j < medLower.length; j++) {
      const medA = medLower[i];
      const medB = medLower[j];

      // Check against known interactions
      for (const interaction of knownInteractions) {
        const hasInteraction = (
          (interaction.drugs[0] === medA && interaction.drugs[1] === medB) ||
          (interaction.drugs[0] === medB && interaction.drugs[1] === medA) ||
          (medA.includes(interaction.drugs[0]) && medB.includes(interaction.drugs[1])) ||
          (medB.includes(interaction.drugs[0]) && medA.includes(interaction.drugs[1]))
        );

        if (hasInteraction) {
          interactions.push({
            drugA: medications[i],
            drugB: medications[j],
            severity: interaction.severity,
            description: interaction.description,
            management: interaction.management,
            evidenceLevel: interaction.evidenceLevel,
            source: 'clinical_database'
          });
        }
      }
    }
  }

  return interactions;
}