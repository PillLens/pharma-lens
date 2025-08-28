import { supabase } from '@/integrations/supabase/client';

export interface DrugInteraction {
  id: string;
  drugA: string;
  drugB: string;
  severity: 'major' | 'moderate' | 'minor';
  description: string;
  management: string;
  evidenceLevel: string;
  source: string;
}

export interface ExternalInteractionResponse {
  interactions: DrugInteraction[];
  source: string;
  lastUpdated: string;
}

class DrugInteractionService {
  // Check for interactions using external API (DrugBank, RxNorm, etc.)
  async checkInteractionsExternal(medications: string[]): Promise<ExternalInteractionResponse | null> {
    if (medications.length < 2) {
      return { interactions: [], source: 'none', lastUpdated: new Date().toISOString() };
    }

    try {
      // Call Supabase Edge Function for external API integration
      const { data, error } = await supabase.functions.invoke('check-drug-interactions', {
        body: { medications }
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('External interaction check failed:', error);
      
      // Fallback to local database
      return this.checkInteractionsLocal(medications);
    }
  }

  // Check for interactions in local Supabase database
  async checkInteractionsLocal(medications: string[]): Promise<ExternalInteractionResponse | null> {
    if (medications.length < 2) {
      return { interactions: [], source: 'local', lastUpdated: new Date().toISOString() };
    }

    try {
      const interactions: DrugInteraction[] = [];
      
      // First, get product IDs for the medications by name
      const productIds: string[] = [];
      for (const medicationName of medications) {
        const { data: products, error } = await supabase
          .from('products')
          .select('id')
          .or(`brand_name.ilike.%${medicationName}%,generic_name.ilike.%${medicationName}%`)
          .limit(1);
        
        if (!error && products && products.length > 0) {
          productIds.push(products[0].id);
        }
      }

      if (productIds.length < 2) {
        return { interactions: [], source: 'local', lastUpdated: new Date().toISOString() };
      }

      // Check for interactions between each pair of medication IDs
      for (let i = 0; i < productIds.length; i++) {
        for (let j = i + 1; j < productIds.length; j++) {
          const medId1 = productIds[i];
          const medId2 = productIds[j];
          
          // Query the database for interactions using the secure function
          const { data, error } = await supabase
            .rpc('get_drug_interactions', {
              medication_a_id_param: medId1,
              medication_b_id_param: medId2
            });

          if (error) {
            console.error('Failed to fetch interactions:', error);
            continue;
          }

          if (data && data.length > 0) {
            data.forEach(interaction => {
              interactions.push({
                id: interaction.id,
                drugA: medId1,
                drugB: medId2,
                severity: this.mapSeverity(interaction.severity_score),
                description: interaction.description,
                management: interaction.management_advice || 'Consult with healthcare provider',
                evidenceLevel: interaction.evidence_level || 'moderate',
                source: 'local_database'
              });
            });
          }
        }
      }

      return {
        interactions,
        source: 'local_database',
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Local interaction check failed:', error);
      return null;
    }
  }

  // Populate interaction database with known drug interactions
  async populateInteractionDatabase(): Promise<void> {
    const commonInteractions = [
      {
        medication_a_id: 'warfarin',
        medication_b_id: 'aspirin',
        interaction_type: 'pharmacodynamic',
        severity_score: 8,
        description: 'Increased risk of bleeding when warfarin is combined with aspirin',
        management_advice: 'Monitor INR closely and watch for signs of bleeding',
        evidence_level: 'High'
      },
      {
        medication_a_id: 'metformin',
        medication_b_id: 'contrast_dye',
        interaction_type: 'pharmacokinetic',
        severity_score: 7,
        description: 'Risk of lactic acidosis with metformin and iodinated contrast',
        management_advice: 'Discontinue metformin 48 hours before contrast procedure',
        evidence_level: 'High'
      },
      {
        medication_a_id: 'digoxin',
        medication_b_id: 'amiodarone',
        interaction_type: 'pharmacokinetic',
        severity_score: 8,
        description: 'Amiodarone increases digoxin levels significantly',
        management_advice: 'Reduce digoxin dose by 50% and monitor levels',
        evidence_level: 'High'
      },
      {
        medication_a_id: 'lisinopril',
        medication_b_id: 'spironolactone',
        interaction_type: 'pharmacodynamic',
        severity_score: 6,
        description: 'Risk of hyperkalemia when combining ACE inhibitors with potassium-sparing diuretics',
        management_advice: 'Monitor serum potassium regularly',
        evidence_level: 'Moderate'
      },
      {
        medication_a_id: 'simvastatin',
        medication_b_id: 'clarithromycin',
        interaction_type: 'pharmacokinetic',
        severity_score: 7,
        description: 'Clarithromycin increases simvastatin levels, increasing risk of rhabdomyolysis',
        management_advice: 'Avoid combination or use alternative statin',
        evidence_level: 'High'
      }
    ];

    try {
      // Note: This function is disabled in production as it requires admin access
      // to modify the medication_interactions table for security reasons
      console.warn('Drug interaction population is disabled for security. Use admin tools to populate data.');
    } catch (error) {
      console.error('Failed to populate interactions:', error);
      throw error;
    }
  }

  // Get interaction details by ID - disabled for security
  async getInteractionDetails(interactionId: string): Promise<DrugInteraction | null> {
    try {
      // Note: Direct access to interaction details by ID is disabled for security
      // Use the checkInteractions method with specific medication IDs instead
      console.warn('Direct interaction lookup by ID is disabled for security');
      return null;
    } catch (error) {
      console.error('Failed to get interaction details:', error);
      return null;
    }
  }

  private mapSeverity(score: number | null): 'major' | 'moderate' | 'minor' {
    if (!score) return 'minor';
    if (score >= 7) return 'major';
    if (score >= 4) return 'moderate';
    return 'minor';
  }
}

export const drugInteractionService = new DrugInteractionService();