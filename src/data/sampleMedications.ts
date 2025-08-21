export const sampleMedications = {
  "panadol": {
    brandName: "Panadol Extra",
    genericName: "Paracetamol",
    strength: "500mg",
    form: "Tablet",
    manufacturer: "GSK Azerbaijan",
    indications: [
      "Relief from headaches and migraines",
      "Fever reduction",
      "Muscle aches and pains",
      "Dental pain relief"
    ],
    contraindications: [
      "Severe liver disease",
      "Allergy to paracetamol",
      "Children under 12 years (for this strength)"
    ],
    warnings: [
      "Do not exceed 8 tablets in 24 hours",
      "Contains caffeine - avoid before bedtime",
      "Consult doctor if symptoms persist over 3 days"
    ],
    sideEffects: [
      "Rare: skin rash",
      "Rare: nausea",
      "Very rare: liver damage with overdose"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Can be taken with or without food",
      timing: "Every 4-6 hours as needed",
      dosageText: "Adults: 1-2 tablets every 4-6 hours. Maximum 8 tablets in 24 hours."
    },
    storage: "Store below 25°C in original packaging. Keep away from children.",
    riskFlags: [],
    qualityScore: 0.92,
    sourceUrl: "https://www.ema.europa.eu/paracetamol"
  },
  
  "aspirin": {
    brandName: "Aspirin Cardio",
    genericName: "Acetylsalicylic Acid",
    strength: "100mg",
    form: "Tablet",
    manufacturer: "Bayer Azerbaijan",
    indications: [
      "Prevention of heart attack and stroke",
      "Cardiovascular protection in high-risk patients"
    ],
    contraindications: [
      "Active bleeding disorders",
      "Severe kidney or liver disease",
      "Children under 16 years",
      "Third trimester of pregnancy"
    ],
    warnings: [
      "Increased bleeding risk",
      "May cause stomach irritation",
      "Stop before surgery",
      "Monitor for signs of bleeding"
    ],
    sideEffects: [
      "Common: stomach upset",
      "Common: increased bleeding tendency",
      "Rare: allergic reactions",
      "Rare: ringing in ears"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Take with food to reduce stomach irritation",
      timing: "Once daily, preferably at the same time",
      dosageText: "Adults: 1 tablet once daily for cardiovascular protection."
    },
    storage: "Store below 25°C. Protect from moisture.",
    riskFlags: ["HIGH_RISK_MED"],
    qualityScore: 0.88,
    sourceUrl: "https://www.ema.europa.eu/aspirin"
  },

  "insulin": {
    brandName: "NovoRapid FlexPen",
    genericName: "Insulin Aspart",
    strength: "100 units/ml",
    form: "Pre-filled pen injection",
    manufacturer: "Novo Nordisk",
    indications: [
      "Treatment of diabetes mellitus in adults and children"
    ],
    contraindications: [
      "Hypoglycemia (low blood sugar)",
      "Hypersensitivity to insulin aspart"
    ],
    warnings: [
      "CRITICAL: Monitor blood glucose levels regularly",
      "Risk of severe hypoglycemia",
      "Injection site rotation required",
      "Never share pens between patients"
    ],
    sideEffects: [
      "Common: hypoglycemia",
      "Common: injection site reactions",
      "Rare: severe allergic reactions",
      "Rare: lipodystrophy at injection sites"
    ],
    howToUse: {
      route: "Subcutaneous injection",
      withFood: "Inject immediately before meals",
      timing: "0-10 minutes before eating",
      dosageText: "DOSAGE MUST BE INDIVIDUALLY DETERMINED BY HEALTHCARE PROVIDER"
    },
    storage: "Refrigerate unused pens (2-8°C). In-use pen: room temperature max 4 weeks.",
    riskFlags: ["HIGH_RISK_MED", "REQUIRES_PRESCRIPTION"],
    qualityScore: 0.95,
    sourceUrl: "https://www.ema.europa.eu/insulin-aspart"
  }
};