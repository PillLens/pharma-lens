import { supabase } from '@/integrations/supabase/client';
import { BaseDataProvider, MedicationData, SearchResult, InteractionData } from './BaseDataProvider';
import { OpenFDAProvider } from './OpenFDAProvider';
import { RxNormProvider } from './RxNormProvider';

export interface DataSource {
  provider_name: string;
  base_url?: string;
  api_key_required: boolean;
  rate_limit_per_hour: number;
  attribution_required: boolean;
  license_type: string;
  supported_countries: string[];
  supported_data_types: string[];
  is_active: boolean;
}

export class GlobalDataProviderService {
  private providers: Map<string, BaseDataProvider> = new Map();
  private dataSources: DataSource[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load data sources from database
      const { data: sources, error } = await supabase
        .from('data_sources')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Failed to load data sources:', error);
        return;
      }

      this.dataSources = sources || [];

      // Initialize providers
      for (const source of this.dataSources) {
        await this.initializeProvider(source);
      }

      this.initialized = true;
      console.log(`Initialized ${this.providers.size} data providers`);
    } catch (error) {
      console.error('Failed to initialize data providers:', error);
    }
  }

  private async initializeProvider(source: DataSource) {
    try {
      let provider: BaseDataProvider | null = null;

      switch (source.provider_name) {
        case 'OpenFDA':
          provider = new OpenFDAProvider({
            baseUrl: source.base_url,
            rateLimitPerHour: source.rate_limit_per_hour,
            timeout: 10000
          });
          break;

        case 'RxNorm':
          provider = new RxNormProvider({
            baseUrl: source.base_url,
            rateLimitPerHour: source.rate_limit_per_hour,
            timeout: 10000
          });
          break;

        // Add more providers here as they're implemented
        default:
          console.log(`Provider ${source.provider_name} not implemented yet`);
          return;
      }

      if (provider) {
        this.providers.set(source.provider_name, provider);
        console.log(`Initialized provider: ${source.provider_name}`);
      }
    } catch (error) {
      console.error(`Failed to initialize provider ${source.provider_name}:`, error);
    }
  }

  async searchMedications(query: string, options: {
    limit?: number;
    country?: string;
    providers?: string[];
    includeLocal?: boolean;
  } = {}): Promise<SearchResult> {
    await this.initialize();

    const {
      limit = 10,
      country,
      providers = [],
      includeLocal = true
    } = options;

    const allResults: MedicationData[] = [];
    let totalCount = 0;
    const sources: string[] = [];

    // Search local database first if requested
    if (includeLocal) {
      try {
        const localResults = await this.searchLocalDatabase(query, limit, country);
        allResults.push(...localResults.medications);
        totalCount += localResults.totalCount;
        if (localResults.medications.length > 0) {
          sources.push('local');
        }
      } catch (error) {
        console.error('Local database search failed:', error);
      }
    }

    // Search external providers
    const targetProviders = providers.length > 0 
      ? providers 
      : this.getProvidersForCountry(country);

    for (const providerName of targetProviders) {
      if (allResults.length >= limit) break;

      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        const providerResults = await provider.searchByName(query, limit - allResults.length);
        allResults.push(...providerResults.medications);
        totalCount += providerResults.totalCount;
        if (providerResults.medications.length > 0) {
          sources.push(providerName);
        }
      } catch (error) {
        console.error(`Provider ${providerName} search failed:`, error);
      }
    }

    // Remove duplicates and sort by confidence score
    const uniqueResults = this.deduplicateResults(allResults);
    const sortedResults = uniqueResults
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, limit);

    return {
      medications: sortedResults,
      totalCount,
      hasMore: totalCount > limit,
      source: sources.join(', ')
    };
  }

  async searchByBarcode(barcode: string, options: {
    country?: string;
    providers?: string[];
    includeLocal?: boolean;
  } = {}): Promise<MedicationData | null> {
    await this.initialize();

    const { country, providers = [], includeLocal = true } = options;

    // Search local database first
    if (includeLocal) {
      try {
        const localResult = await this.searchLocalByBarcode(barcode);
        if (localResult) return localResult;
      } catch (error) {
        console.error('Local barcode search failed:', error);
      }
    }

    // Search external providers
    const targetProviders = providers.length > 0 
      ? providers 
      : this.getProvidersForCountry(country);

    for (const providerName of targetProviders) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        const result = await provider.searchByBarcode(barcode);
        if (result) {
          // Store in local database for future reference
          await this.cacheExternalResult(result);
          return result;
        }
      } catch (error) {
        console.error(`Provider ${providerName} barcode search failed:`, error);
      }
    }

    return null;
  }

  private async searchLocalDatabase(query: string, limit: number, country?: string): Promise<SearchResult> {
    try {
      let queryBuilder = supabase
        .from('products')
        .select('*')
        .or(`brand_name.ilike.%${query}%,generic_name.ilike.%${query}%`)
        .eq('verification_status', 'verified')
        .limit(limit);

      if (country) {
        queryBuilder = queryBuilder.eq('country_code', country);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      const medications = (data || []).map(item => this.transformDatabaseRecord(item));

      return {
        medications,
        totalCount: medications.length,
        hasMore: false,
        source: 'local'
      };
    } catch (error) {
      console.error('Local database search failed:', error);
      return { medications: [], totalCount: 0, hasMore: false, source: 'local' };
    }
  }

  private async searchLocalByBarcode(barcode: string): Promise<MedicationData | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`barcode.eq.${barcode},ndc_number.eq.${barcode},gtin.eq.${barcode}`)
        .eq('verification_status', 'verified')
        .maybeSingle();

      if (error) throw error;
      return data ? this.transformDatabaseRecord(data) : null;
    } catch (error) {
      console.error('Local barcode search failed:', error);
      return null;
    }
  }

  private transformDatabaseRecord(record: any): MedicationData {
    return {
      brand_name: record.brand_name,
      generic_name: record.generic_name,
      strength: record.strength,
      form: record.form,
      manufacturer: record.manufacturer,
      country_code: record.country_code,
      barcode: record.barcode,
      ndc_number: record.ndc_number,
      gtin: record.gtin,
      rxcui: record.rxcui,
      atc_code: record.atc_code,
      image_url: record.image_url,
      leaflet_url: record.leaflet_url,
      active_ingredients: record.active_ingredients || [],
      dosage_forms: record.dosage_forms || [],
      therapeutic_class: record.therapeutic_class,
      prescription_required: record.prescription_required,
      safety_warnings: record.safety_warnings || [],
      storage_conditions: record.storage_conditions,
      search_keywords: record.search_keywords || [],
      source_provider: record.source_provider || 'local',
      source_id: record.source_id,
      source_url: record.source_url,
      license_type: record.license_type || 'free',
      attribution_text: record.attribution_text,
      confidence_score: record.confidence_score || 0.80,
      regulatory_authority: record.regulatory_authority,
      registration_number: record.registration_number
    };
  }

  private async cacheExternalResult(medication: MedicationData): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .upsert({
          brand_name: medication.brand_name,
          generic_name: medication.generic_name,
          strength: medication.strength,
          form: medication.form,
          manufacturer: medication.manufacturer,
          country_code: medication.country_code,
          barcode: medication.barcode,
          ndc_number: medication.ndc_number,
          gtin: medication.gtin,
          rxcui: medication.rxcui,
          atc_code: medication.atc_code,
          active_ingredients: medication.active_ingredients,
          dosage_forms: medication.dosage_forms,
          therapeutic_class: medication.therapeutic_class,
          prescription_required: medication.prescription_required,
          safety_warnings: medication.safety_warnings,
          storage_conditions: medication.storage_conditions,
          search_keywords: medication.search_keywords,
          source_provider: medication.source_provider,
          source_id: medication.source_id,
          source_url: medication.source_url,
          license_type: medication.license_type,
          attribution_text: medication.attribution_text,
          confidence_score: medication.confidence_score,
          regulatory_authority: medication.regulatory_authority,
          registration_number: medication.registration_number,
          verification_status: 'verified',
          last_sync: new Date().toISOString()
        }, { 
          onConflict: 'barcode,ndc_number,gtin',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Failed to cache external result:', error);
      }
    } catch (error) {
      console.error('Failed to cache external result:', error);
    }
  }

  private getProvidersForCountry(country?: string): string[] {
    if (!country) {
      return ['OpenFDA', 'RxNorm']; // Default providers
    }

    const providers: string[] = [];
    
    for (const source of this.dataSources) {
      if (source.supported_countries.includes(country) || 
          source.supported_countries.includes('GLOBAL')) {
        providers.push(source.provider_name);
      }
    }

    return providers;
  }

  private deduplicateResults(results: MedicationData[]): MedicationData[] {
    const seen = new Set<string>();
    const unique: MedicationData[] = [];

    for (const result of results) {
      // Create a key for deduplication based on name and strength
      const key = `${result.generic_name || result.brand_name}-${result.strength}`.toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    return unique;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getDataSources(): DataSource[] {
    return [...this.dataSources];
  }
}

export const globalDataProviderService = new GlobalDataProviderService();