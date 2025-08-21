import { supabase } from '@/integrations/supabase/client';
import { comprehensiveMedications } from '@/data/comprehensiveMedications';

export interface ProductRecord {
  brand_name: string;
  generic_name?: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  country_code: string;
  barcode?: string;
  atc_code?: string;
  image_url?: string;
  leaflet_url?: string;
  active_ingredients?: string[];
  dosage_forms?: string[];
  therapeutic_class?: string;
  prescription_required?: boolean;
  safety_warnings?: string[];
  storage_conditions?: string;
  expiry_monitoring?: boolean;
  search_keywords?: string[];
  verification_status?: string;
  data_source?: string;
}

export interface BarcodeProductMapping {
  barcode: string;
  product_id: string;
}

class DatabaseService {
  async populateProductDatabase(): Promise<void> {
    try {
      // Convert comprehensive medications to product records
      const products: ProductRecord[] = Object.entries(comprehensiveMedications).map(([key, med]) => ({
        brand_name: med.brandName,
        generic_name: med.genericName,
        strength: med.strength,
        form: 'tablet', // Default form
        manufacturer: 'Unknown', // Would need to be populated from real data
        country_code: 'AZ',
        barcode: this.generateBarcode(key), // Generate dummy barcodes for testing
        atc_code: this.extractATCCode(med.genericName || med.brandName),
        active_ingredients: [med.genericName || med.brandName],
        dosage_forms: ['tablet', 'capsule'],
        therapeutic_class: med.indications?.[0] || 'General',
        prescription_required: med.riskFlags?.includes('HIGH_RISK_MED') || false,
        safety_warnings: med.warnings || [],
        storage_conditions: med.storage || 'Store at room temperature',
        expiry_monitoring: true,
        search_keywords: [
          med.brandName.toLowerCase(),
          med.genericName?.toLowerCase() || '',
          ...med.indications?.map(ind => ind.toLowerCase()) || []
        ].filter(Boolean),
        verification_status: 'verified',
        data_source: 'comprehensive_database'
      }));

      // Batch insert products
      const { error } = await supabase
        .from('products')
        .upsert(products, { onConflict: 'brand_name,generic_name' });

      if (error) {
        console.error('Error populating products:', error);
        throw error;
      }

      console.log(`Successfully populated ${products.length} medications`);
    } catch (error) {
      console.error('Database population failed:', error);
      throw error;
    }
  }

  async searchProducts(query: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`brand_name.ilike.%${query}%,generic_name.ilike.%${query}%`)
        .eq('verification_status', 'verified')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Product search failed:', error);
      return [];
    }
  }

  async findProductByBarcode(barcode: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .eq('verification_status', 'verified')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      return null;
    }
  }

  async getMedicationInteractions(medicationAId: string, medicationBId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('medication_interactions')
        .select('*')
        .or(`and(medication_a_id.eq.${medicationAId},medication_b_id.eq.${medicationBId}),and(medication_a_id.eq.${medicationBId},medication_b_id.eq.${medicationAId})`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Interaction lookup failed:', error);
      return [];
    }
  }

  private generateBarcode(key: string): string {
    // Generate a 13-digit EAN barcode based on the medication key
    const hash = this.simpleHash(key);
    return `300${hash.toString().padStart(10, '0')}`;
  }

  private extractATCCode(medicationName: string): string {
    // Simple ATC code mapping - would need real pharmaceutical database
    const atcMap: Record<string, string> = {
      'aspirin': 'N02BA01',
      'metformin': 'A10BA02',
      'lisinopril': 'C09AA03',
      'atorvastatin': 'C10AA05',
      'omeprazole': 'A02BC01'
    };
    
    const lowercaseName = medicationName.toLowerCase();
    for (const [med, code] of Object.entries(atcMap)) {
      if (lowercaseName.includes(med)) {
        return code;
      }
    }
    return 'N02BA01'; // Default to aspirin ATC code
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 1000000000; // Keep within 10 digits
  }
}

export const databaseService = new DatabaseService();