import { BaseDataProvider, DataProviderConfig, MedicationData, SearchResult } from './BaseDataProvider';

export class OpenFDAProvider extends BaseDataProvider {
  constructor(config: Partial<DataProviderConfig> = {}) {
    super('OpenFDA', {
      baseUrl: 'https://api.fda.gov',
      rateLimitPerHour: 240, // FDA allows 240 requests per hour
      timeout: 10000,
      ...config
    });
  }

  async searchByName(query: string, limit = 10): Promise<SearchResult> {
    try {
      const normalizedQuery = this.normalizeName(query);
      const url = `${this.config.baseUrl}/drug/ndc.json?search=brand_name:"${encodeURIComponent(query)}"OR generic_name:"${encodeURIComponent(query)}"&limit=${limit}`;

      const response = await this.fetchWithTimeout(url);
      const data = await response.json();

      const medications: MedicationData[] = [];

      if (data.results) {
        for (const item of data.results) {
          try {
            const medication = this.transformFDAData(item);
            medications.push(medication);
          } catch (error) {
            console.warn(`Failed to transform FDA data for item:`, error);
          }
        }
      }

      return {
        medications,
        totalCount: data.meta?.results?.total || medications.length,
        hasMore: (data.meta?.results?.total || 0) > limit,
        source: this.providerName
      };
    } catch (error) {
      console.error(`OpenFDA search failed:`, error);
      return {
        medications: [],
        totalCount: 0,
        hasMore: false,
        source: this.providerName
      };
    }
  }

  async searchByBarcode(barcode: string): Promise<MedicationData | null> {
    try {
      // Try to search by NDC number (barcode might be an NDC)
      const url = `${this.config.baseUrl}/drug/ndc.json?search=product_ndc:"${barcode}"&limit=1`;
      
      const response = await this.fetchWithTimeout(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return this.transformFDAData(data.results[0]);
      }

      return null;
    } catch (error) {
      console.error(`OpenFDA barcode search failed:`, error);
      return null;
    }
  }

  private transformFDAData(item: any): MedicationData {
    const brandName = item.brand_name || item.proprietary_name || 'Unknown Brand';
    const genericName = item.generic_name || item.nonproprietary_name || '';
    const strength = item.active_ingredients?.[0]?.strength || '';
    const dosageForm = item.dosage_form || item.route?.[0] || '';

    return this.createMedicationData({
      brand_name: brandName,
      generic_name: genericName,
      strength: strength,
      form: dosageForm,
      manufacturer: item.labeler_name || '',
      country_code: 'US',
      ndc_number: item.product_ndc,
      active_ingredients: item.active_ingredients?.map((ing: any) => ing.name) || [genericName].filter(Boolean),
      dosage_forms: item.dosage_form ? [item.dosage_form] : [],
      prescription_required: this.isPrescriptionRequired(item),
      source_provider: this.providerName,
      source_id: item.product_ndc,
      source_url: `https://dailymed.nlm.nih.gov/dailymed/`,
      license_type: 'free',
      attribution_text: 'Data provided by openFDA',
      confidence_score: 0.90,
      regulatory_authority: 'FDA',
      registration_number: item.application_number,
      search_keywords: [
        brandName.toLowerCase(),
        genericName.toLowerCase(),
        ...(item.active_ingredients?.map((ing: any) => ing.name.toLowerCase()) || [])
      ].filter(Boolean)
    });
  }

  private isPrescriptionRequired(item: any): boolean {
    // FDA data doesn't directly indicate prescription status
    // We make educated guesses based on available data
    const marketingCategory = item.marketing_category?.toLowerCase() || '';
    
    // NDA (New Drug Application) and ANDA (Abbreviated New Drug Application) 
    // are typically prescription drugs
    if (marketingCategory.includes('nda') || marketingCategory.includes('anda')) {
      return true;
    }

    // OTC (Over The Counter) drugs don't require prescription
    if (marketingCategory.includes('otc')) {
      return false;
    }

    // Default to prescription required for safety
    return true;
  }

  async syncBatch(lastSync?: Date): Promise<{ success: number; failed: number }> {
    // This would implement batch synchronization of FDA data
    // For now, return placeholder values
    return { success: 0, failed: 0 };
  }
}