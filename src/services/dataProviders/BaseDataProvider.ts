export interface DataProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  rateLimitPerHour: number;
  timeout: number;
}

export interface MedicationData {
  brand_name: string;
  generic_name?: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  country_code: string;
  barcode?: string;
  ndc_number?: string;
  gtin?: string;
  rxcui?: string;
  atc_code?: string;
  image_url?: string;
  leaflet_url?: string;
  active_ingredients?: string[];
  dosage_forms?: string[];
  therapeutic_class?: string;
  prescription_required?: boolean;
  safety_warnings?: string[];
  storage_conditions?: string;
  search_keywords?: string[];
  source_provider: string;
  source_id?: string;
  source_url?: string;
  license_type: string;
  attribution_text?: string;
  confidence_score: number;
  regulatory_authority?: string;
  registration_number?: string;
}

export interface SearchResult {
  medications: MedicationData[];
  totalCount: number;
  hasMore: boolean;
  source: string;
}

export interface InteractionData {
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  management_advice?: string;
  evidence_level?: string;
  source_provider: string;
}

export abstract class BaseDataProvider {
  protected config: DataProviderConfig;
  protected providerName: string;
  protected lastRequestTime = 0;
  protected requestCount = 0;
  protected windowStart = 0;

  constructor(providerName: string, config: DataProviderConfig) {
    this.providerName = providerName;
    this.config = config;
  }

  protected async rateLimitCheck(): Promise<void> {
    const now = Date.now();
    const windowDuration = 60 * 60 * 1000; // 1 hour in milliseconds

    // Reset counter if we're in a new window
    if (now - this.windowStart >= windowDuration) {
      this.windowStart = now;
      this.requestCount = 0;
    }

    // Check if we've exceeded the rate limit
    if (this.requestCount >= this.config.rateLimitPerHour) {
      const waitTime = windowDuration - (now - this.windowStart);
      throw new Error(`Rate limit exceeded for ${this.providerName}. Wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Enforce minimum delay between requests
    const minDelay = Math.ceil(3600000 / this.config.rateLimitPerHour); // ms between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
    }

    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  protected async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    await this.rateLimitCheck();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Abstract methods that each provider must implement
  abstract searchByName(query: string, limit?: number): Promise<SearchResult>;
  abstract searchByBarcode(barcode: string): Promise<MedicationData | null>;
  abstract syncBatch?(lastSync?: Date): Promise<{ success: number; failed: number }>;

  // Optional methods for different provider capabilities
  async getInteractions?(medicationA: string, medicationB: string): Promise<InteractionData[]> {
    return [];
  }
  async getATCCode?(medicationName: string): Promise<string | null> {
    return null;
  }

  async getRxCUI?(medicationName: string): Promise<string | null> {
    return null;
  }

  // Utility method to normalize medication names
  protected normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  }

  // Utility method to create medication data with proper attribution
  protected createMedicationData(data: Partial<MedicationData>): MedicationData {
    return {
      brand_name: '',
      country_code: 'UNKNOWN',
      source_provider: this.providerName,
      license_type: 'free',
      confidence_score: 0.5,
      ...data,
    };
  }
}