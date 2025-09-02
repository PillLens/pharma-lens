import { supabase } from '@/integrations/supabase/client';
import { comprehensiveMedications } from '@/data/comprehensiveMedications';
import { realBarcodeMappings, findProductByBarcode } from '@/data/realBarcodeMappings';
import { drugInteractionService } from './drugInteractionService';
import { storageService } from './storageService';
import { globalDataProviderService } from './dataProviders/GlobalDataProviderService';

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
      console.log('Starting database population...');
      
      // Step 1: Populate comprehensive medications
      const comprehensiveProducts: ProductRecord[] = Object.entries(comprehensiveMedications).map(([key, med]) => ({
        brand_name: med.brandName,
        generic_name: med.genericName,
        strength: med.strength,
        form: 'tablet',
        manufacturer: 'Generic',
        country_code: 'AZ',
        barcode: this.generateBarcode(key),
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
        source_provider: 'Comprehensive_DB',
        confidence_score: 0.88,
        license_type: 'proprietary'
      }));

      // Step 2: Add real barcode mappings
      const realProducts: ProductRecord[] = realBarcodeMappings.map(mapping => ({
        brand_name: mapping.productName,
        generic_name: mapping.genericName,
        strength: mapping.strength,
        form: mapping.form,
        manufacturer: mapping.manufacturer,
        country_code: mapping.country,
        barcode: mapping.barcode,
        atc_code: this.extractATCCode(mapping.genericName),
        active_ingredients: [mapping.genericName],
        dosage_forms: [mapping.form],
        therapeutic_class: this.getTherapeuticClass(mapping.genericName),
        prescription_required: this.requiresPrescription(mapping.genericName),
        safety_warnings: this.getSafetyWarnings(mapping.genericName),
        storage_conditions: 'Store as directed on package',
        expiry_monitoring: true,
        search_keywords: [
          mapping.productName.toLowerCase(),
          mapping.genericName.toLowerCase(),
          mapping.manufacturer.toLowerCase()
        ],
        verification_status: 'verified',
        source_provider: 'Azerbaijan_Local',
        confidence_score: 0.85,
        license_type: 'proprietary'
      }));

      // Combine both datasets
      const allProducts = [...comprehensiveProducts, ...realProducts];

      // Batch insert products
      const { error: productError } = await supabase
        .from('products')
        .upsert(allProducts, { onConflict: 'barcode' });

      if (productError) {
        console.error('Error populating products:', productError);
        throw productError;
      }

      console.log(`Successfully populated ${allProducts.length} medications`);

      // Step 3: Populate drug interactions
      await drugInteractionService.populateInteractionDatabase();
      console.log('Successfully populated drug interactions');

    } catch (error) {
      console.error('Database population failed:', error);
      throw error;
    }
  }

  async searchProducts(query: string, limit: number = 10, options: {
    country?: string;
    providers?: string[];
    includeExternal?: boolean;
  } = {}): Promise<any[]> {
    try {
      const { includeExternal = true, ...searchOptions } = options;

      // Use global data provider service for comprehensive search
      if (includeExternal) {
        const results = await globalDataProviderService.searchMedications(query, {
          limit,
          ...searchOptions
        });
        return results.medications;
      }

      // Fallback to local database only
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

  async findProductByBarcode(barcode: string, options: {
    country?: string;
    providers?: string[];
    includeExternal?: boolean;
  } = {}): Promise<any | null> {
    try {
      const { includeExternal = true, ...searchOptions } = options;

      // Use global data provider service for comprehensive barcode search
      if (includeExternal) {
        const result = await globalDataProviderService.searchByBarcode(barcode, searchOptions);
        if (result) return result;
      }

      // First try real barcode mappings for immediate response (legacy support)
      const realMapping = findProductByBarcode(barcode);
      if (realMapping) {
        // Check if this product exists in database
        const { data: existingProduct } = await supabase
          .from('products')
          .select('*')
          .or(`barcode.eq.${barcode},ndc_number.eq.${barcode},gtin.eq.${barcode}`)
          .eq('verification_status', 'verified')
          .maybeSingle();

        if (existingProduct) {
          return existingProduct;
        }

        // If not in database, return mapped data
        return {
          brand_name: realMapping.productName,
          generic_name: realMapping.genericName,
          strength: realMapping.strength,
          form: realMapping.form,
          manufacturer: realMapping.manufacturer,
          barcode: realMapping.barcode,
          country_code: realMapping.country,
          verification_status: 'verified',
          source_provider: 'Azerbaijan_Local'
        };
      }

      // Fallback to database search
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`barcode.eq.${barcode},ndc_number.eq.${barcode},gtin.eq.${barcode}`)
        .eq('verification_status', 'verified')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Barcode lookup failed:', error);
      return null;
    }
  }

  async getMedicationInteractions(medicationAId: string, medicationBId: string): Promise<any[]> {
    try {
      // Use the secure function for drug interaction queries
      const { data, error } = await supabase
        .rpc('get_drug_interactions', {
          medication_a_id_param: medicationAId,
          medication_b_id_param: medicationBId
        });

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

  private getTherapeuticClass(genericName: string): string {
    const therapeuticMap: Record<string, string> = {
      'acetylsalicylic acid': 'Analgesic/Antiplatelet',
      'lisinopril': 'ACE Inhibitor',
      'atorvastatin': 'Statin',
      'metoprolol': 'Beta Blocker',
      'metformin': 'Antidiabetic',
      'salbutamol': 'Bronchodilator',
      'omeprazole': 'Proton Pump Inhibitor',
      'amoxicillin': 'Antibiotic',
      'paracetamol': 'Analgesic/Antipyretic',
      'ibuprofen': 'NSAID',
      'cholecalciferol': 'Vitamin D'
    };

    const lowercaseName = genericName.toLowerCase();
    for (const [med, theClass] of Object.entries(therapeuticMap)) {
      if (lowercaseName.includes(med)) {
        return theClass;
      }
    }
    return 'General';
  }

  private requiresPrescription(genericName: string): boolean {
    const prescriptionRequired = [
      'lisinopril', 'atorvastatin', 'metoprolol', 'metformin', 
      'salbutamol', 'omeprazole', 'amoxicillin', 'azithromycin'
    ];
    
    const lowercaseName = genericName.toLowerCase();
    return prescriptionRequired.some(med => lowercaseName.includes(med));
  }

  private getSafetyWarnings(genericName: string): string[] {
    const warningsMap: Record<string, string[]> = {
      'acetylsalicylic acid': ['May cause stomach bleeding', 'Do not use in children under 16'],
      'metformin': ['Monitor kidney function', 'Risk of lactic acidosis'],
      'lisinopril': ['Monitor kidney function and potassium', 'May cause dry cough'],
      'omeprazole': ['Long-term use may affect bone health', 'May interact with clopidogrel'],
      'amoxicillin': ['Check for penicillin allergy', 'Complete full course']
    };

    const lowercaseName = genericName.toLowerCase();
    for (const [med, warnings] of Object.entries(warningsMap)) {
      if (lowercaseName.includes(med)) {
        return warnings;
      }
    }
    return [];
  }
}

export const databaseService = new DatabaseService();