import { BaseDataProvider, DataProviderConfig, MedicationData, SearchResult } from './BaseDataProvider';

export class RxNormProvider extends BaseDataProvider {
  constructor(config: Partial<DataProviderConfig> = {}) {
    super('RxNorm', {
      baseUrl: 'https://rxnav.nlm.nih.gov',
      rateLimitPerHour: 20, // Conservative rate limiting
      timeout: 10000,
      ...config
    });
  }

  async searchByName(query: string, limit = 10): Promise<SearchResult> {
    try {
      // First, get concepts for the search term
      const conceptsUrl = `${this.config.baseUrl}/REST/drugs.json?name=${encodeURIComponent(query)}`;
      const conceptsResponse = await this.fetchWithTimeout(conceptsUrl);
      const conceptsData = await conceptsResponse.json();

      const medications: MedicationData[] = [];

      if (conceptsData.drugGroup?.conceptGroup) {
        for (const group of conceptsData.drugGroup.conceptGroup) {
          if (group.conceptProperties) {
            for (const concept of group.conceptProperties.slice(0, limit)) {
              try {
                const medication = await this.transformRxNormConcept(concept);
                if (medication) {
                  medications.push(medication);
                }
              } catch (error) {
                console.warn(`Failed to transform RxNorm concept:`, error);
              }
            }
          }
        }
      }

      return {
        medications: medications.slice(0, limit),
        totalCount: medications.length,
        hasMore: false, // RxNorm doesn't provide total counts easily
        source: this.providerName
      };
    } catch (error) {
      console.error(`RxNorm search failed:`, error);
      return {
        medications: [],
        totalCount: 0,
        hasMore: false,
        source: this.providerName
      };
    }
  }

  async searchByBarcode(barcode: string): Promise<MedicationData | null> {
    // RxNorm doesn't have barcode data, so this always returns null
    return null;
  }

  async getRxCUI(medicationName: string): Promise<string | null> {
    try {
      const url = `${this.config.baseUrl}/REST/rxcui.json?name=${encodeURIComponent(medicationName)}&search=1`;
      const response = await this.fetchWithTimeout(url);
      const data = await response.json();

      if (data.idGroup?.rxnormId) {
        return data.idGroup.rxnormId[0];
      }

      return null;
    } catch (error) {
      console.error(`RxNorm RXCUI lookup failed:`, error);
      return null;
    }
  }

  private async transformRxNormConcept(concept: any): Promise<MedicationData | null> {
    try {
      // Get additional details for the concept
      const detailsUrl = `${this.config.baseUrl}/REST/rxcui/${concept.rxcui}/properties.json`;
      const detailsResponse = await this.fetchWithTimeout(detailsUrl);
      const detailsData = await detailsResponse.json();

      const properties = detailsData.properties;
      if (!properties) return null;

      // Get ingredients
      const ingredientsUrl = `${this.config.baseUrl}/REST/rxcui/${concept.rxcui}/related.json?tty=IN`;
      const ingredientsResponse = await this.fetchWithTimeout(ingredientsUrl);
      const ingredientsData = await ingredientsResponse.json();

      const ingredients = ingredientsData.relatedGroup?.conceptGroup
        ?.find((g: any) => g.tty === 'IN')
        ?.conceptProperties?.map((prop: any) => prop.name) || [];

      return this.createMedicationData({
        brand_name: concept.name,
        generic_name: ingredients[0] || concept.name,
        strength: this.extractStrength(concept.name),
        form: this.extractForm(concept.name),
        manufacturer: '',
        country_code: 'US',
        rxcui: concept.rxcui,
        active_ingredients: ingredients,
        therapeutic_class: properties.tty || '',
        source_provider: this.providerName,
        source_id: concept.rxcui,
        source_url: `https://mor.nlm.nih.gov/RxNav/search?searchBy=RXCUI&searchTerm=${concept.rxcui}`,
        license_type: 'free',
        attribution_text: 'Data provided by RxNorm/RxNav (NIH)',
        confidence_score: 0.85,
        search_keywords: [
          concept.name.toLowerCase(),
          ...ingredients.map((ing: string) => ing.toLowerCase())
        ].filter(Boolean)
      });
    } catch (error) {
      console.error(`Failed to get RxNorm details for ${concept.rxcui}:`, error);
      return null;
    }
  }

  private extractStrength(name: string): string {
    const strengthMatch = name.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units?|iu)/i);
    return strengthMatch ? `${strengthMatch[1]}${strengthMatch[2].toLowerCase()}` : '';
  }

  private extractForm(name: string): string {
    const formPatterns = [
      /\b(tablet|capsule|injection|syrup|cream|ointment|drops|spray|patch|gel|lotion)\b/i
    ];

    for (const pattern of formPatterns) {
      const match = name.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }

    return 'oral';
  }

  async syncBatch(lastSync?: Date): Promise<{ success: number; failed: number }> {
    // RxNorm is more suitable for real-time lookups than batch sync
    return { success: 0, failed: 0 };
  }
}