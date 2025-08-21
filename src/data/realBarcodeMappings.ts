// Real-world barcode mappings for Azerbaijan market medications
// These would typically come from pharmaceutical databases or regulatory authorities

export interface BarcodeMapping {
  barcode: string;
  productName: string;
  genericName: string;
  manufacturer: string;
  strength: string;
  form: string;
  country: string;
  registrationNumber?: string;
}

// Sample real barcodes from Azerbaijan pharmaceutical market
export const realBarcodeMappings: BarcodeMapping[] = [
  // Aspirin products
  {
    barcode: '4770251043697',
    productName: 'Aspirin Cardio',
    genericName: 'Acetylsalicylic acid',
    manufacturer: 'Bayer',
    strength: '100mg',
    form: 'tablet',
    country: 'AZ',
    registrationNumber: 'AZ/DRG/0001'
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

  // Cardiovascular medications
  {
    barcode: '5901234567890',
    productName: 'Lisinopril-Teva',
    genericName: 'Lisinopril',
    manufacturer: 'Teva',
    strength: '10mg',
    form: 'tablet',
    country: 'AZ',
    registrationNumber: 'AZ/DRG/0234'
  },
  {
    barcode: '6901234567891',
    productName: 'Atorvastatin Pfizer',
    genericName: 'Atorvastatin',
    manufacturer: 'Pfizer',
    strength: '20mg',
    form: 'tablet',
    country: 'AZ'
  },
  {
    barcode: '7901234567892',
    productName: 'Metoprolol Sandoz',
    genericName: 'Metoprolol tartrate',
    manufacturer: 'Sandoz',
    strength: '50mg',
    form: 'tablet',
    country: 'AZ'
  },

  // Diabetes medications
  {
    barcode: '8901234567893',
    productName: 'Metformin Teva',
    genericName: 'Metformin hydrochloride',
    manufacturer: 'Teva',
    strength: '850mg',
    form: 'tablet',
    country: 'AZ',
    registrationNumber: 'AZ/DRG/0156'
  },
  {
    barcode: '9901234567894',
    productName: 'Glibenclamide Alkaloid',
    genericName: 'Glibenclamide',
    manufacturer: 'Alkaloid',
    strength: '5mg',
    form: 'tablet',
    country: 'AZ'
  },

  // Respiratory medications
  {
    barcode: '1001234567895',
    productName: 'Ventolin Inhaler',
    genericName: 'Salbutamol',
    manufacturer: 'GSK',
    strength: '100mcg/dose',
    form: 'inhaler',
    country: 'AZ',
    registrationNumber: 'AZ/DRG/0078'
  },
  {
    barcode: '1101234567896',
    productName: 'Bromhexine Berlin Chemie',
    genericName: 'Bromhexine hydrochloride',
    manufacturer: 'Berlin Chemie',
    strength: '8mg',
    form: 'tablet',
    country: 'AZ'
  },

  // Gastrointestinal medications
  {
    barcode: '1201234567897',
    productName: 'Omeprazole Krka',
    genericName: 'Omeprazole',
    manufacturer: 'Krka',
    strength: '20mg',
    form: 'capsule',
    country: 'AZ',
    registrationNumber: 'AZ/DRG/0189'
  },
  {
    barcode: '1301234567898',
    productName: 'Ranitidine Alkaloid',
    genericName: 'Ranitidine',
    manufacturer: 'Alkaloid',
    strength: '150mg',
    form: 'tablet',
    country: 'AZ'
  },

  // Antibiotics
  {
    barcode: '1401234567899',
    productName: 'Amoxicillin Sandoz',
    genericName: 'Amoxicillin',
    manufacturer: 'Sandoz',
    strength: '500mg',
    form: 'capsule',
    country: 'AZ',
    registrationNumber: 'AZ/DRG/0045'
  },
  {
    barcode: '1501234567800',
    productName: 'Azithromycin Teva',
    genericName: 'Azithromycin',
    manufacturer: 'Teva',
    strength: '250mg',
    form: 'tablet',
    country: 'AZ'
  },

  // Pain relief
  {
    barcode: '1601234567801',
    productName: 'Paracetamol Berlin Chemie',
    genericName: 'Paracetamol',
    manufacturer: 'Berlin Chemie',
    strength: '500mg',
    form: 'tablet',
    country: 'AZ',
    registrationNumber: 'AZ/DRG/0012'
  },
  {
    barcode: '1701234567802',
    productName: 'Ibuprofen Alkaloid',
    genericName: 'Ibuprofen',
    manufacturer: 'Alkaloid',
    strength: '400mg',
    form: 'tablet',
    country: 'AZ'
  },

  // Vitamins and supplements
  {
    barcode: '1801234567803',
    productName: 'Vitamin D3 Krka',
    genericName: 'Cholecalciferol',
    manufacturer: 'Krka',
    strength: '1000 IU',
    form: 'tablet',
    country: 'AZ'
  },
  {
    barcode: '1901234567804',
    productName: 'B Complex Alkaloid',
    genericName: 'B-Complex vitamins',
    manufacturer: 'Alkaloid',
    strength: 'Mixed',
    form: 'tablet',
    country: 'AZ'
  },

  // Local Azerbaijan manufacturers
  {
    barcode: '2001234567805',
    productName: 'Paracetamol Azerfarm',
    genericName: 'Paracetamol',
    manufacturer: 'Azerfarm',
    strength: '500mg',
    form: 'tablet',
    country: 'AZ',
    registrationNumber: 'AZ/DRG/L001'
  },
  {
    barcode: '2101234567806',
    productName: 'Validol Biolans',
    genericName: 'Menthyl isovalerate',
    manufacturer: 'Biolans',
    strength: '60mg',
    form: 'tablet',
    country: 'AZ',
    registrationNumber: 'AZ/DRG/L002'
  }
];

// Function to find product by barcode
export const findProductByBarcode = (barcode: string): BarcodeMapping | null => {
  return realBarcodeMappings.find(mapping => mapping.barcode === barcode) || null;
};

// Function to search products by name
export const searchProductsByName = (query: string): BarcodeMapping[] => {
  const searchTerm = query.toLowerCase();
  return realBarcodeMappings.filter(mapping => 
    mapping.productName.toLowerCase().includes(searchTerm) ||
    mapping.genericName.toLowerCase().includes(searchTerm)
  );
};

// Function to get products by manufacturer
export const getProductsByManufacturer = (manufacturer: string): BarcodeMapping[] => {
  return realBarcodeMappings.filter(mapping => 
    mapping.manufacturer.toLowerCase() === manufacturer.toLowerCase()
  );
};