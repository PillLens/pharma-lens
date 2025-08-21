export const comprehensiveMedications = {
  // Cardiovascular Medications
  "8697546454564": {
    brandName: "Aspirin Cardio",
    genericName: "Acetylsalicylic Acid",
    strength: "100mg",
    form: "Tablet",
    manufacturer: "Bayer Azerbaijan",
    atcCode: "B01AC06",
    category: "Cardiovascular",
    indications: [
      "Prevention of heart attack and stroke",
      "Cardiovascular protection in high-risk patients",
      "Prevention of blood clots"
    ],
    contraindications: [
      "Active bleeding disorders",
      "Severe kidney or liver disease",
      "Children under 16 years",
      "Third trimester of pregnancy",
      "History of gastrointestinal bleeding"
    ],
    warnings: [
      "CRITICAL: Increased bleeding risk",
      "May cause stomach irritation",
      "Stop before surgery (7-10 days)",
      "Monitor for signs of bleeding",
      "Regular blood tests recommended"
    ],
    sideEffects: [
      "Common: stomach upset, nausea",
      "Common: increased bleeding tendency",
      "Rare: allergic reactions",
      "Rare: ringing in ears (tinnitus)",
      "Very rare: severe gastrointestinal bleeding"
    ],
    interactions: [
      "Warfarin - CRITICAL: Increased bleeding risk",
      "Metformin - Enhanced hypoglycemic effect",
      "Alcohol - Increased gastrointestinal bleeding risk",
      "Ibuprofen - Reduced cardioprotective effect"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Take with food to reduce stomach irritation",
      timing: "Once daily, preferably at the same time",
      dosageText: "Adults: 1 tablet once daily for cardiovascular protection."
    },
    storage: "Store below 25°C. Protect from moisture.",
    riskFlags: ["HIGH_RISK_MED", "BLEEDING_RISK"],
    qualityScore: 0.88,
    sourceUrl: "https://www.ema.europa.eu/aspirin"
  },

  "8697546454001": {
    brandName: "Amlodipine-Teva",
    genericName: "Amlodipine Besylate",
    strength: "5mg",
    form: "Tablet",
    manufacturer: "Teva Azerbaijan",
    atcCode: "C08CA01",
    category: "Cardiovascular",
    indications: [
      "High blood pressure (hypertension)",
      "Angina (chest pain)",
      "Coronary artery disease"
    ],
    contraindications: [
      "Allergy to amlodipine or dihydropyridines",
      "Severe aortic stenosis",
      "Cardiogenic shock",
      "Severe hypotension"
    ],
    warnings: [
      "May cause dizziness - avoid driving initially",
      "Ankle swelling is common",
      "Monitor blood pressure regularly",
      "Gradual dose reduction needed when stopping"
    ],
    sideEffects: [
      "Common: ankle swelling, dizziness",
      "Common: headache, fatigue",
      "Rare: gum overgrowth",
      "Very rare: liver problems"
    ],
    interactions: [
      "Simvastatin - Increased muscle toxicity risk",
      "Diltiazem - Enhanced blood pressure lowering",
      "Grapefruit juice - Increased amlodipine levels"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Can be taken with or without food",
      timing: "Once daily, same time each day",
      dosageText: "Adults: Usually 5mg once daily. Maximum 10mg daily."
    },
    storage: "Store below 30°C in original packaging.",
    riskFlags: ["REQUIRES_MONITORING"],
    qualityScore: 0.91,
    sourceUrl: "https://www.ema.europa.eu/amlodipine"
  },

  // Diabetes Medications
  "8697546454002": {
    brandName: "NovoRapid FlexPen",
    genericName: "Insulin Aspart",
    strength: "100 units/ml",
    form: "Pre-filled pen injection",
    manufacturer: "Novo Nordisk",
    atcCode: "A10AB05",
    category: "Diabetes",
    indications: [
      "Type 1 diabetes mellitus",
      "Type 2 diabetes mellitus when insulin is required"
    ],
    contraindications: [
      "Hypoglycemia (low blood sugar)",
      "Hypersensitivity to insulin aspart"
    ],
    warnings: [
      "CRITICAL: Monitor blood glucose levels regularly",
      "Risk of severe hypoglycemia - can be life-threatening",
      "Injection site rotation required",
      "NEVER share pens between patients",
      "Adjust dose based on blood glucose, meals, exercise"
    ],
    sideEffects: [
      "Common: hypoglycemia, injection site reactions",
      "Common: weight gain",
      "Rare: severe allergic reactions",
      "Rare: lipodystrophy at injection sites"
    ],
    interactions: [
      "ACE inhibitors - May enhance hypoglycemic effect",
      "Beta-blockers - May mask hypoglycemic symptoms",
      "Alcohol - Increased hypoglycemia risk",
      "Corticosteroids - May increase blood glucose"
    ],
    howToUse: {
      route: "Subcutaneous injection",
      withFood: "Inject 0-10 minutes before meals",
      timing: "Before each main meal",
      dosageText: "DOSAGE MUST BE INDIVIDUALLY DETERMINED BY HEALTHCARE PROVIDER"
    },
    storage: "Refrigerate unused pens (2-8°C). In-use pen: room temperature max 4 weeks.",
    riskFlags: ["HIGH_RISK_MED", "REQUIRES_PRESCRIPTION", "REQUIRES_MONITORING"],
    qualityScore: 0.95,
    sourceUrl: "https://www.ema.europa.eu/insulin-aspart"
  },

  "8697546454003": {
    brandName: "Metformin Zentiva",
    genericName: "Metformin Hydrochloride",
    strength: "500mg",
    form: "Film-coated tablet",
    manufacturer: "Zentiva Azerbaijan",
    atcCode: "A10BA02",
    category: "Diabetes",
    indications: [
      "Type 2 diabetes mellitus",
      "Prevention of diabetes in pre-diabetic patients",
      "Polycystic ovary syndrome (PCOS)"
    ],
    contraindications: [
      "Severe kidney disease (GFR <30)",
      "Severe liver disease",
      "Heart failure requiring medication",
      "Severe dehydration",
      "Alcohol abuse"
    ],
    warnings: [
      "Risk of lactic acidosis - rare but serious",
      "Stop before contrast dye procedures",
      "Monitor kidney function regularly",
      "May cause vitamin B12 deficiency with long-term use"
    ],
    sideEffects: [
      "Very common: nausea, vomiting, diarrhea",
      "Common: abdominal pain, metallic taste",
      "Rare: lactic acidosis",
      "Very rare: vitamin B12 deficiency"
    ],
    interactions: [
      "Contrast dye - Stop metformin 48 hours before",
      "Alcohol - Increased lactic acidosis risk",
      "Diuretics - May affect kidney function",
      "Corticosteroids - May reduce effectiveness"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Take with or after meals to reduce stomach upset",
      timing: "Usually twice daily with breakfast and dinner",
      dosageText: "Adults: Start 500mg twice daily. Maximum 3g daily in divided doses."
    },
    storage: "Store below 25°C. Protect from moisture.",
    riskFlags: ["REQUIRES_MONITORING", "KIDNEY_FUNCTION"],
    qualityScore: 0.93,
    sourceUrl: "https://www.ema.europa.eu/metformin"
  },

  // Pain & Inflammation
  "8697546454004": {
    brandName: "Panadol Extra",
    genericName: "Paracetamol + Caffeine",
    strength: "500mg + 65mg",
    form: "Tablet",
    manufacturer: "GSK Azerbaijan",
    atcCode: "N02BE51",
    category: "Analgesic",
    indications: [
      "Relief from headaches and migraines",
      "Fever reduction",
      "Muscle aches and pains",
      "Dental pain relief",
      "Menstrual pain"
    ],
    contraindications: [
      "Severe liver disease",
      "Allergy to paracetamol or caffeine",
      "Children under 12 years (for this strength)"
    ],
    warnings: [
      "Do not exceed 8 tablets in 24 hours",
      "Contains caffeine - avoid before bedtime",
      "Consult doctor if symptoms persist over 3 days",
      "Risk of liver damage with overdose",
      "Limit caffeine from other sources"
    ],
    sideEffects: [
      "Rare: skin rash, nausea",
      "Rare: restlessness (due to caffeine)",
      "Very rare: liver damage with overdose",
      "Very rare: blood disorders"
    ],
    interactions: [
      "Warfarin - May enhance anticoagulant effect",
      "Alcohol - Increased liver toxicity risk",
      "Other caffeine sources - Avoid excessive caffeine",
      "Seizure medications - May affect drug levels"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Can be taken with or without food",
      timing: "Every 4-6 hours as needed",
      dosageText: "Adults: 1-2 tablets every 4-6 hours. Maximum 8 tablets in 24 hours."
    },
    storage: "Store below 25°C in original packaging. Keep away from children.",
    riskFlags: ["LIVER_TOXICITY"],
    qualityScore: 0.92,
    sourceUrl: "https://www.ema.europa.eu/paracetamol"
  },

  "8697546454005": {
    brandName: "Ibuprofen Nycomed",
    genericName: "Ibuprofen",
    strength: "400mg",
    form: "Film-coated tablet",
    manufacturer: "Nycomed Azerbaijan",
    atcCode: "M01AE01",
    category: "NSAID",
    indications: [
      "Pain relief (mild to moderate)",
      "Inflammation reduction",
      "Fever reduction",
      "Arthritis symptoms",
      "Menstrual cramps"
    ],
    contraindications: [
      "Active peptic ulcer",
      "History of gastrointestinal bleeding",
      "Severe heart failure",
      "Severe kidney or liver disease",
      "Third trimester of pregnancy"
    ],
    warnings: [
      "CRITICAL: Increased risk of heart attack and stroke",
      "May cause serious stomach bleeding",
      "Use lowest effective dose for shortest duration",
      "Monitor blood pressure regularly",
      "Avoid in late pregnancy"
    ],
    sideEffects: [
      "Common: stomach upset, heartburn",
      "Common: dizziness, headache",
      "Serious: gastrointestinal bleeding",
      "Serious: cardiovascular events",
      "Rare: kidney problems"
    ],
    interactions: [
      "Aspirin - Reduced cardioprotective effect of aspirin",
      "Warfarin - Increased bleeding risk",
      "ACE inhibitors - Reduced effectiveness, kidney risk",
      "Lithium - Increased lithium levels"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Take with food to reduce stomach irritation",
      timing: "Every 6-8 hours as needed",
      dosageText: "Adults: 400mg every 6-8 hours. Maximum 1200mg daily."
    },
    storage: "Store below 25°C. Protect from light and moisture.",
    riskFlags: ["HIGH_RISK_MED", "CARDIOVASCULAR_RISK", "GI_BLEEDING_RISK"],
    qualityScore: 0.89,
    sourceUrl: "https://www.ema.europa.eu/ibuprofen"
  },

  // Antibiotics
  "8697546454006": {
    brandName: "Amoxicillin Sandoz",
    genericName: "Amoxicillin",
    strength: "500mg",
    form: "Capsule",
    manufacturer: "Sandoz Azerbaijan",
    atcCode: "J01CA04",
    category: "Antibiotic",
    indications: [
      "Bacterial infections of respiratory tract",
      "Urinary tract infections",
      "Skin and soft tissue infections",
      "Dental infections",
      "H. pylori eradication (with other drugs)"
    ],
    contraindications: [
      "Allergy to penicillins",
      "History of severe allergic reaction to beta-lactams",
      "Infectious mononucleosis"
    ],
    warnings: [
      "Complete full course even if feeling better",
      "May cause antibiotic-associated diarrhea",
      "Risk of C. difficile infection",
      "May reduce effectiveness of oral contraceptives"
    ],
    sideEffects: [
      "Common: diarrhea, nausea, skin rash",
      "Common: vaginal thrush in women",
      "Serious: severe allergic reactions (anaphylaxis)",
      "Serious: C. difficile-associated diarrhea"
    ],
    interactions: [
      "Oral contraceptives - Reduced effectiveness",
      "Methotrexate - Increased methotrexate toxicity",
      "Warfarin - Enhanced anticoagulant effect",
      "Probiotics - Take 2 hours apart"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Can be taken with or without food",
      timing: "Every 8 hours (3 times daily)",
      dosageText: "Adults: Usually 500mg three times daily. Complete full course."
    },
    storage: "Store below 25°C in original packaging.",
    riskFlags: ["REQUIRES_PRESCRIPTION", "COMPLETE_COURSE"],
    qualityScore: 0.94,
    sourceUrl: "https://www.ema.europa.eu/amoxicillin"
  },

  // Mental Health
  "8697546454007": {
    brandName: "Sertraline Pfizer",
    genericName: "Sertraline Hydrochloride",
    strength: "50mg",
    form: "Film-coated tablet",
    manufacturer: "Pfizer Azerbaijan",
    atcCode: "N06AB06",
    category: "Antidepressant",
    indications: [
      "Major depressive disorder",
      "Panic disorder",
      "Obsessive-compulsive disorder (OCD)",
      "Post-traumatic stress disorder (PTSD)",
      "Social anxiety disorder"
    ],
    contraindications: [
      "Use with MAO inhibitors",
      "Hypersensitivity to sertraline",
      "Concurrent use with pimozide"
    ],
    warnings: [
      "CRITICAL: May increase suicidal thoughts in young adults",
      "Do not stop suddenly - gradual withdrawal needed",
      "May take 4-6 weeks to show full effect",
      "Monitor for worsening depression or unusual behavior changes",
      "May affect ability to drive or operate machinery"
    ],
    sideEffects: [
      "Common: nausea, diarrhea, insomnia",
      "Common: sexual dysfunction, weight changes",
      "Common: dizziness, dry mouth",
      "Serious: serotonin syndrome (with other drugs)",
      "Rare: suicidal ideation"
    ],
    interactions: [
      "MAO inhibitors - CONTRAINDICATED: Serotonin syndrome risk",
      "Tramadol - Increased serotonin syndrome risk",
      "Warfarin - Enhanced anticoagulant effect",
      "NSAIDs - Increased bleeding risk"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Can be taken with or without food",
      timing: "Once daily, preferably in the morning",
      dosageText: "Adults: Start 50mg once daily. May increase under medical supervision."
    },
    storage: "Store below 30°C. Keep away from children.",
    riskFlags: ["HIGH_RISK_MED", "REQUIRES_PRESCRIPTION", "PSYCHIATRIC_MED", "SUICIDE_RISK"],
    qualityScore: 0.91,
    sourceUrl: "https://www.ema.europa.eu/sertraline"
  },

  // Respiratory
  "8697546454008": {
    brandName: "Ventolin HFA",
    genericName: "Salbutamol Sulfate",
    strength: "100mcg/dose",
    form: "Pressurized inhalation",
    manufacturer: "GSK Azerbaijan",
    atcCode: "R03AC02",
    category: "Respiratory",
    indications: [
      "Asthma (acute relief and prevention)",
      "Chronic obstructive pulmonary disease (COPD)",
      "Exercise-induced bronchospasm",
      "Acute bronchospasm"
    ],
    contraindications: [
      "Hypersensitivity to salbutamol",
      "Tachyarrhythmias (with caution)"
    ],
    warnings: [
      "CRITICAL: If no relief after 2 puffs, seek immediate medical help",
      "Overuse may indicate worsening asthma",
      "May cause paradoxical bronchospasm",
      "Monitor heart rate and blood pressure",
      "Prime inhaler before first use"
    ],
    sideEffects: [
      "Common: tremor, headache, palpitations",
      "Common: muscle cramps, throat irritation",
      "Rare: paradoxical bronchospasm",
      "Very rare: allergic reactions"
    ],
    interactions: [
      "Beta-blockers - May reduce effectiveness",
      "Diuretics - Risk of low potassium",
      "Digoxin - Increased digoxin toxicity risk",
      "MAO inhibitors - Enhanced cardiovascular effects"
    ],
    howToUse: {
      route: "Inhalation",
      withFood: "Not applicable",
      timing: "As needed for symptoms, or before exercise",
      dosageText: "Adults: 1-2 puffs as needed. Maximum 8 puffs in 24 hours."
    },
    storage: "Store below 30°C. Do not puncture or burn. Protect from freezing.",
    riskFlags: ["REQUIRES_PRESCRIPTION", "EMERGENCY_MED"],
    qualityScore: 0.96,
    sourceUrl: "https://www.ema.europa.eu/salbutamol"
  },

  // Gastrointestinal
  "8697546454009": {
    brandName: "Omeprazole Krka",
    genericName: "Omeprazole",
    strength: "20mg",
    form: "Gastro-resistant capsule",
    manufacturer: "Krka Azerbaijan",
    atcCode: "A02BC01",
    category: "Gastrointestinal",
    indications: [
      "Gastroesophageal reflux disease (GERD)",
      "Peptic ulcer disease",
      "H. pylori eradication (with antibiotics)",
      "Prevention of NSAID-induced ulcers",
      "Zollinger-Ellison syndrome"
    ],
    contraindications: [
      "Hypersensitivity to omeprazole or benzimidazoles",
      "Concurrent use with atazanavir, nelfinavir"
    ],
    warnings: [
      "Long-term use may increase infection risk",
      "May mask symptoms of gastric cancer",
      "Risk of bone fractures with long-term high-dose use",
      "May cause vitamin B12 deficiency",
      "Gradual withdrawal recommended for long-term users"
    ],
    sideEffects: [
      "Common: headache, nausea, diarrhea",
      "Common: abdominal pain, constipation",
      "Long-term: increased infection risk",
      "Rare: severe skin reactions",
      "Very rare: liver problems"
    ],
    interactions: [
      "Clopidogrel - Reduced antiplatelet effect",
      "Warfarin - Enhanced anticoagulant effect",
      "Digoxin - Increased digoxin levels",
      "Iron supplements - Reduced iron absorption"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Take before food, preferably in the morning",
      timing: "Once daily, same time each day",
      dosageText: "Adults: Usually 20mg once daily. Swallow whole, do not chew."
    },
    storage: "Store below 25°C in original packaging. Protect from moisture.",
    riskFlags: ["LONG_TERM_MONITORING"],
    qualityScore: 0.90,
    sourceUrl: "https://www.ema.europa.eu/omeprazole"
  },

  // Thyroid
  "8697546454010": {
    brandName: "Euthyrox",
    genericName: "Levothyroxine Sodium",
    strength: "50mcg",
    form: "Tablet",
    manufacturer: "Merck Azerbaijan",
    atcCode: "H03AA01",
    category: "Thyroid",
    indications: [
      "Hypothyroidism",
      "Thyroid cancer (as adjunct therapy)",
      "Goiter prevention and treatment",
      "Thyroid suppression therapy"
    ],
    contraindications: [
      "Hyperthyroidism",
      "Acute myocardial infarction",
      "Acute myocarditis",
      "Untreated adrenal insufficiency"
    ],
    warnings: [
      "CRITICAL: Start with low dose in elderly and cardiac patients",
      "Regular thyroid function monitoring required",
      "May worsen angina or arrhythmias",
      "Take on empty stomach for best absorption",
      "Many drug interactions - check all medications"
    ],
    sideEffects: [
      "Overdose symptoms: palpitations, anxiety, insomnia",
      "Overdose: weight loss, heat intolerance",
      "Rare: allergic reactions",
      "Long-term overdose: osteoporosis risk"
    ],
    interactions: [
      "Iron supplements - Take 4 hours apart",
      "Calcium - Take 4 hours apart",
      "Coffee - May reduce absorption",
      "Warfarin - Enhanced anticoagulant effect",
      "Digoxin - May need dose adjustment"
    ],
    howToUse: {
      route: "Oral",
      withFood: "Take on empty stomach, 30-60 minutes before breakfast",
      timing: "Once daily in the morning",
      dosageText: "Adults: Dose individualized based on TSH levels. Start low in elderly."
    },
    storage: "Store below 25°C in original packaging. Protect from light and moisture.",
    riskFlags: ["REQUIRES_PRESCRIPTION", "REQUIRES_MONITORING", "CARDIAC_RISK"],
    qualityScore: 0.93,
    sourceUrl: "https://www.ema.europa.eu/levothyroxine"
  }
};

// Drug interaction database
export const drugInteractions = {
  // Major interactions (avoid combination)
  major: [
    {
      drug1: "warfarin",
      drug2: "aspirin",
      severity: "major",
      description: "Significantly increased bleeding risk",
      management: "Monitor INR closely if combination necessary"
    },
    {
      drug1: "sertraline",
      drug2: "tramadol",
      severity: "major",
      description: "Risk of serotonin syndrome",
      management: "Avoid combination or monitor closely for serotonin syndrome symptoms"
    },
    {
      drug1: "metformin",
      drug2: "contrast_dye",
      severity: "major",
      description: "Risk of lactic acidosis",
      management: "Stop metformin 48 hours before and after contrast procedures"
    }
  ],
  
  // Moderate interactions (use with caution)
  moderate: [
    {
      drug1: "ibuprofen",
      drug2: "amlodipine",
      severity: "moderate",
      description: "May reduce antihypertensive effect",
      management: "Monitor blood pressure more frequently"
    },
    {
      drug1: "omeprazole",
      drug2: "clopidogrel",
      severity: "moderate",
      description: "Reduced antiplatelet effect",
      management: "Consider alternative PPI or monitor platelet function"
    }
  ],
  
  // Minor interactions (monitor)
  minor: [
    {
      drug1: "levothyroxine",
      drug2: "iron",
      severity: "minor",
      description: "Reduced thyroid hormone absorption",
      management: "Take iron 4 hours after levothyroxine"
    }
  ]
};

// Safety thresholds and validation rules
export const safetyThresholds = {
  confidence: {
    minimum: 0.7,
    warning: 0.85,
    good: 0.9
  },
  
  riskFlags: {
    HIGH_RISK_MED: {
      description: "High-risk medication requiring special monitoring",
      color: "red",
      actions: ["Verify with healthcare provider", "Monitor closely for side effects"]
    },
    BLEEDING_RISK: {
      description: "Increased bleeding risk",
      color: "orange",
      actions: ["Monitor for bleeding signs", "Avoid other blood thinners"]
    },
    REQUIRES_MONITORING: {
      description: "Regular monitoring required",
      color: "yellow",
      actions: ["Schedule regular check-ups", "Monitor relevant parameters"]
    },
    PSYCHIATRIC_MED: {
      description: "Psychiatric medication",
      color: "purple",
      actions: ["Monitor mood changes", "Never stop abruptly"]
    },
    SUICIDE_RISK: {
      description: "May increase suicidal thoughts",
      color: "red",
      actions: ["Monitor closely for mood changes", "Immediate medical attention if suicidal thoughts"]
    }
  }
};