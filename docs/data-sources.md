# Data Sources Documentation

This document outlines the data sources, licensing terms, and integration approach for worldwide medication coverage in PillLens.

## Overview

PillLens has transitioned from an Azerbaijan-only medication registry to worldwide coverage with proper source attribution and country tagging. This ensures compliance with licensing requirements while providing comprehensive global medication data.

## Global Data Sources

### 1. WHO ATC/DDD Classification System
- **URL**: https://www.whocc.no/atc_ddd_index/
- **Coverage**: Global classification system
- **License**: Free for non-commercial use
- **Rate Limits**: No specific limits documented
- **Fields Available**:
  - ATC codes (Anatomical Therapeutic Chemical)
  - DDD (Defined Daily Dose) values
  - Therapeutic classifications
- **Attribution Required**: Yes
- **Example Payload**:
```json
{
  "atc_code": "N02BA01",
  "name": "Acetylsalicylic acid",
  "ddd": "3 g",
  "unit": "O",
  "therapeutic_class": "Analgesics and antipyretics"
}
```

### 2. RxNorm (US)
- **URL**: https://rxnav.nlm.nih.gov/
- **Coverage**: US normalized medication names and ingredients
- **License**: Free (NIH/NLM)
- **Rate Limits**: ~20 requests per minute (recommended)
- **Fields Available**:
  - RxCUI (RxNorm Concept Unique Identifier)
  - Normalized drug names
  - Active ingredients
  - Dose forms
  - Strengths
- **Attribution Required**: Yes - "Data provided by RxNorm (NIH)"
- **Example API Call**: `GET /REST/drugs.json?name=aspirin`
- **Example Response**:
```json
{
  "drugGroup": {
    "conceptGroup": [{
      "tty": "IN",
      "conceptProperties": [{
        "rxcui": "1191",
        "name": "Aspirin",
        "synonym": "Acetylsalicylic acid"
      }]
    }]
  }
}
```

### 3. OpenFDA (US)
- **URL**: https://api.fda.gov/
- **Coverage**: US FDA-approved medications and labeling
- **License**: Free (US Government)
- **Rate Limits**: 240 requests per hour, 1000 per day
- **Fields Available**:
  - NDC (National Drug Code) numbers
  - Brand and generic names
  - Manufacturers
  - SPL (Structured Product Labeling) data
  - Active ingredients
- **Attribution Required**: Yes - "Data provided by openFDA"
- **Example API Call**: `GET /drug/ndc.json?search=brand_name:"tylenol"&limit=1`
- **Example Response**:
```json
{
  "results": [{
    "product_ndc": "50580-506",
    "brand_name": "Tylenol",
    "generic_name": "acetaminophen",
    "labeler_name": "Johnson & Johnson",
    "active_ingredients": [{
      "name": "ACETAMINOPHEN",
      "strength": "325 mg/1"
    }],
    "dosage_form": "TABLET"
  }]
}
```

### 4. EMA - European Medicines Agency (EU)
- **URL**: https://www.ema.europa.eu/
- **Coverage**: EU approved medications
- **License**: Free for non-commercial use
- **Rate Limits**: ~60 requests per hour (estimated)
- **Fields Available**:
  - SmPC (Summary of Product Characteristics)
  - EPAR (European Public Assessment Report)
  - Marketing authorization data
- **Attribution Required**: Yes
- **Data Format**: XML/PDF text extraction required
- **Integration Status**: Planned (requires text processing)

### 5. Health Canada Drug Product Database (DPD)
- **URL**: https://health-products.canada.ca/dpd-bdpp/
- **Coverage**: Canadian approved medications  
- **License**: Free (Government of Canada)
- **Rate Limits**: ~100 requests per hour (estimated)
- **Fields Available**:
  - DIN (Drug Identification Number)
  - Brand and generic names
  - Manufacturers
  - Active ingredients
- **Attribution Required**: Yes
- **Integration Status**: Planned

### 6. Australian Register of Therapeutic Goods (ARTG)
- **URL**: https://www.tga.gov.au/
- **Coverage**: Australian approved medications
- **License**: Free (Australian Government)
- **Rate Limits**: ~100 requests per hour (estimated)
- **Fields Available**:
  - AUST R numbers
  - Product names
  - Sponsors/manufacturers
- **Attribution Required**: Yes
- **Integration Status**: Planned

## Commercial Sources (License Required)

### DrugBank
- **URL**: https://go.drugbank.com/
- **Coverage**: Comprehensive drug data
- **License**: Commercial license required
- **Status**: Flagged for future consideration
- **Note**: Not used without proper licensing

### Medscape Drug Reference
- **URL**: https://reference.medscape.com/
- **Coverage**: Clinical drug information
- **License**: Commercial/Subscription
- **Status**: Not implemented
- **Note**: Requires subscription for API access

## Barcode & Packaging Data

### NDC → GTIN Mapping
- **Source**: FDA NDC database + manufacturer data
- **Coverage**: US products with Global Trade Item Numbers
- **License**: Free where available from official sources
- **Limitations**: Not all NDC codes have GTIN mappings

### EAN/UPC Catalogs
- **Source**: Official product catalogs from manufacturers
- **Coverage**: Global, varies by manufacturer cooperation
- **License**: Varies by source
- **Status**: Case-by-case integration

## Interaction Data

### RxNav Interaction API
- **URL**: https://rxnav.nlm.nih.gov/InteractionAPIs.html
- **Coverage**: US drug-drug interactions
- **License**: Free (NIH)
- **Rate Limits**: Conservative usage recommended
- **Fields Available**:
  - Interaction severity (high, moderate, low)
  - Clinical effects
  - Management recommendations
- **Example API Call**: `GET /interaction/interaction.json?rxcui=207106&rxcui=656659`

## Implementation Architecture

### Provider Adapters
Each data source has a dedicated adapter implementing the `BaseDataProvider` interface:
- `OpenFDAProvider.ts` - US FDA data
- `RxNormProvider.ts` - US normalized names
- `WHOATCProvider.ts` - Global classifications (planned)
- `EMAProvider.ts` - EU medications (planned)

### Rate Limiting & Caching
- Implement per-provider rate limiting
- Cache responses locally in Supabase
- Batch operations for efficiency
- Graceful degradation when APIs are unavailable

### Data Quality & Attribution
- Confidence scoring for all data sources
- Proper attribution text for licensing compliance
- Source provenance tracking
- Data quality monitoring

## Regional Configuration

### Country-Specific Providers
```typescript
const regionProviders = {
  'US': ['OpenFDA', 'RxNorm'],
  'EU': ['EMA', 'WHO_ATC'],
  'CA': ['Health_Canada_DPD', 'RxNorm'],
  'AU': ['ARTG_Australia'],
  'AZ': ['Azerbaijan_Local'], // Legacy support
  'GLOBAL': ['WHO_ATC', 'RxNorm']
};
```

### Fallback Strategy
1. Try region-specific providers first
2. Fall back to global providers (WHO ATC, RxNorm)
3. Use local Azerbaijan database as last resort
4. AI extraction for unknown medications

## Compliance & Legal Notes

### Attribution Requirements
All API responses include proper attribution:
```json
{
  "data": {...},
  "attribution": "Data provided by openFDA, RxNorm (NIH)",
  "license_type": "free",
  "data_sources": ["OpenFDA", "RxNorm"]
}
```

### Rate Limit Compliance
- Respect all documented rate limits
- Implement exponential backoff for failed requests
- Monitor usage to stay within limits
- Cache aggressively to minimize API calls

### Data Retention
- Cache external data for reasonable periods
- Respect any data retention requirements
- Regular cleanup of expired cached data
- Audit trail for all external API usage

## Future Enhancements

### Additional Sources
- New Zealand Medsafe
- Singapore HSA
- Japan PMDA
- Brazil ANVISA

### Enhanced Features
- Real-time pricing data (where available)
- Clinical trial information
- Adverse event reporting integration
- Pharmacy availability APIs

## Monitoring & Maintenance

### Health Checks
- Daily verification of API availability
- Data quality monitoring
- Attribution compliance audits
- Performance metric tracking

### Update Procedures  
- Regular synchronization schedules
- Incremental vs full data refreshes
- Change detection and notification
- Version control for data schemas

---

*Last Updated: January 2025*  
*Next Review: March 2025*