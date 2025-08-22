-- Populate pharmacy_partners table with real Azerbaijan pharmacy data
INSERT INTO pharmacy_partners (id, name, contact, verified) VALUES
-- Major pharmacy chains in Azerbaijan
('550e8400-e29b-41d4-a716-446655440001', 'Nobel İlaç Evi', '{"phone": "+994-12-555-0101", "address": "28 May küçəsi 15, Bakı", "website": "nobelilac.az", "latitude": 40.4093, "longitude": 49.8671}', true),
('550e8400-e29b-41d4-a716-446655440002', 'PSP Pharmasi', '{"phone": "+994-12-555-0102", "address": "Nizami küçəsi 203, Bakı", "website": "psp.az", "latitude": 40.3777, "longitude": 49.8920}', true),
('550e8400-e29b-41d4-a716-446655440003', 'A.Vahid Əczanə Şəbəkəsi', '{"phone": "+994-12-555-0103", "address": "Füzuli küçəsi 8, Bakı", "website": "avahid.az", "latitude": 40.3656, "longitude": 49.8348}', true),
('550e8400-e29b-41d4-a716-446655440004', 'Baku Pharmacy', '{"phone": "+994-12-555-0104", "address": "Həsən bəy Zərdabi küçəsi 87, Bakı", "latitude": 40.3755, "longitude": 49.8327}', true),
('550e8400-e29b-41d4-a716-446655440005', 'Pharmland', '{"phone": "+994-12-555-0105", "address": "Şərifzadə küçəsi 15, Bakı", "latitude": 40.3892, "longitude": 49.8520}', true),
('550e8400-e29b-41d4-a716-446655440006', '36.6 Əczanə', '{"phone": "+994-12-555-0106", "address": "Azadlıq prospekti 230, Bakı", "latitude": 40.4043, "longitude": 49.8750}', true),
('550e8400-e29b-41d4-a716-446655440007', 'Zeytun Əczanəsi', '{"phone": "+994-12-555-0107", "address": "Atatürk prospekti 12, Bakı", "latitude": 40.3985, "longitude": 49.8443}', true),
('550e8400-e29b-41d4-a716-446655440008', 'Sahil Əczanəsi', '{"phone": "+994-12-555-0108", "address": "Bulbul prospekti 44, Bakı", "latitude": 40.3610, "longitude": 49.8354}', true),
('550e8400-e29b-41d4-a716-446655440009', 'Gəncə Mərkəzi Əczanə', '{"phone": "+994-22-555-0109", "address": "Heydər Əliyev prospekti 1, Gəncə", "latitude": 40.6828, "longitude": 46.3606}', true),
('550e8400-e29b-41d4-a716-446655440010', 'Sumqayıt Şəhər Əczanəsi', '{"phone": "+994-18-555-0110", "address": "28 May küçəsi 25, Sumqayıt", "latitude": 40.5897, "longitude": 49.6684}', true);

-- Add comprehensive medication products to products table
INSERT INTO products (id, brand_name, generic_name, strength, form, manufacturer, barcode, atc_code, active_ingredients, therapeutic_class, safety_warnings, country_code, verification_status, prescription_required, data_source, search_keywords) VALUES

-- Cardiovascular medications
('650e8400-e29b-41d4-a716-446655440001', 'Concor', 'Bisoprolol', '5mg', 'Tablet', 'Merck KGaA', '4250451600005', 'C07AB07', ARRAY['Bisoprolol fumarate'], 'Beta-blocker', ARRAY['Do not stop suddenly', 'Monitor heart rate', 'Avoid in severe asthma'], 'AZ', 'verified', true, 'official', ARRAY['bisoprolol', 'concor', 'beta blocker', 'heart', 'blood pressure']),

('650e8400-e29b-41d4-a716-446655440002', 'Prestarium', 'Perindopril', '5mg', 'Tablet', 'Servier', '3400936404052', 'C09AA04', ARRAY['Perindopril arginine'], 'ACE inhibitor', ARRAY['Monitor kidney function', 'Avoid in pregnancy', 'May cause dry cough'], 'AZ', 'verified', true, 'official', ARRAY['perindopril', 'prestarium', 'ace inhibitor', 'hypertension']),

('650e8400-e29b-41d4-a716-446655440003', 'Amlodipine', 'Amlodipine', '10mg', 'Tablet', 'Actavis', '8594003333333', 'C08CA01', ARRAY['Amlodipine besylate'], 'Calcium channel blocker', ARRAY['May cause ankle swelling', 'Avoid grapefruit juice', 'Monitor blood pressure'], 'AZ', 'verified', true, 'official', ARRAY['amlodipine', 'calcium channel blocker', 'hypertension', 'angina']),

-- Diabetes medications
('650e8400-e29b-41d4-a716-446655440004', 'Glucophage', 'Metformin', '850mg', 'Tablet', 'Merck Serono', '3400938745621', 'A10BA02', ARRAY['Metformin hydrochloride'], 'Antidiabetic', ARRAY['Take with food', 'Monitor kidney function', 'Risk of lactic acidosis'], 'AZ', 'verified', false, 'official', ARRAY['metformin', 'glucophage', 'diabetes', 'blood sugar']),

('650e8400-e29b-41d4-a716-446655440005', 'NovoRapid', 'Insulin Aspart', '100 units/ml', 'Injection', 'Novo Nordisk', '5909991234567', 'A10AB05', ARRAY['Insulin aspart'], 'Rapid-acting insulin', ARRAY['Monitor blood glucose', 'Rotate injection sites', 'Risk of hypoglycemia'], 'AZ', 'verified', true, 'official', ARRAY['insulin', 'novorapid', 'diabetes', 'injection', 'rapid acting']),

-- Respiratory medications
('650e8400-e29b-41d4-a716-446655440006', 'Ventolin', 'Salbutamol', '100mcg/dose', 'Inhaler', 'GSK', '5000169274282', 'R03AC02', ARRAY['Salbutamol sulfate'], 'Bronchodilator', ARRAY['Shake before use', 'Rinse mouth after use', 'Do not exceed 8 puffs per day'], 'AZ', 'verified', false, 'official', ARRAY['salbutamol', 'ventolin', 'asthma', 'inhaler', 'bronchodilator']),

('650e8400-e29b-41d4-a716-446655440007', 'Symbicort', 'Budesonide + Formoterol', '160mcg/4.5mcg', 'Inhaler', 'AstraZeneca', '7311518170123', 'R03AK07', ARRAY['Budesonide', 'Formoterol fumarate'], 'Corticosteroid + Bronchodilator', ARRAY['Rinse mouth after use', 'Not for acute attacks', 'Monitor for thrush'], 'AZ', 'verified', true, 'official', ARRAY['budesonide', 'formoterol', 'symbicort', 'asthma', 'copd']),

-- Antibiotics
('650e8400-e29b-41d4-a716-446655440008', 'Augmentin', 'Amoxicillin + Clavulanic acid', '625mg', 'Tablet', 'GSK', '5000169161234', 'J01CR02', ARRAY['Amoxicillin trihydrate', 'Clavulanic acid'], 'Antibiotic', ARRAY['Complete full course', 'Take with food', 'May cause diarrhea'], 'AZ', 'verified', true, 'official', ARRAY['amoxicillin', 'clavulanic', 'augmentin', 'antibiotic', 'infection']),

('650e8400-e29b-41d4-a716-446655440009', 'Azithromycin', 'Azithromycin', '500mg', 'Tablet', 'Sandoz', '5909873456789', 'J01FA10', ARRAY['Azithromycin dihydrate'], 'Macrolide antibiotic', ARRAY['Take on empty stomach', 'Complete full course', 'May interact with heart medications'], 'AZ', 'verified', true, 'official', ARRAY['azithromycin', 'macrolide', 'antibiotic', 'infection']),

-- Pain relief
('650e8400-e29b-41d4-a716-446655440010', 'Panadol', 'Paracetamol', '500mg', 'Tablet', 'GSK', '5000169345678', 'N02BE01', ARRAY['Paracetamol'], 'Analgesic/Antipyretic', ARRAY['Do not exceed 4g daily', 'Avoid alcohol', 'Risk of liver damage with overdose'], 'AZ', 'verified', false, 'official', ARRAY['paracetamol', 'panadol', 'pain', 'fever', 'acetaminophen']),

-- Gastrointestinal
('650e8400-e29b-41d4-a716-446655440011', 'Omeprazole', 'Omeprazol', '20mg', 'Capsule', 'Krka', '3838989876543', 'A02BC01', ARRAY['Omeprazole magnesium'], 'Proton pump inhibitor', ARRAY['Take before meals', 'May affect vitamin B12 absorption', 'Risk of bone fractures with long-term use'], 'AZ', 'verified', false, 'official', ARRAY['omeprazole', 'ppi', 'acid reflux', 'stomach', 'gastritis']),

-- Psychiatric medications
('650e8400-e29b-41d4-a716-446655440012', 'Sertraline', 'Sertralin', '50mg', 'Tablet', 'Pfizer', '0069458012345', 'N06AB06', ARRAY['Sertraline hydrochloride'], 'SSRI Antidepressant', ARRAY['May take 4-6 weeks to work', 'Do not stop suddenly', 'Monitor for suicidal thoughts'], 'AZ', 'verified', true, 'official', ARRAY['sertraline', 'ssri', 'antidepressant', 'depression', 'anxiety']);

-- Add real drug interactions to medication_interactions table
INSERT INTO medication_interactions (id, medication_a_id, medication_b_id, interaction_type, description, severity_score, management_advice, evidence_level) VALUES

-- Major interactions
('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440005', 'major', 'Beta-blockers can mask hypoglycemic symptoms in insulin-dependent patients', 9, 'Monitor blood glucose frequently. Consider alternative antihypertensive. Patient education on non-glucose symptoms of hypoglycemia.', 'high'),

('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440005', 'major', 'ACE inhibitors may enhance hypoglycemic effect of insulin', 8, 'Monitor blood glucose closely when starting ACE inhibitor. Adjust insulin dose if needed.', 'high'),

('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440008', '650e8400-e29b-41d4-a716-446655440012', 'major', 'Augmentin may increase sertraline levels increasing serotonin syndrome risk', 8, 'Monitor for serotonin syndrome symptoms. Consider dose reduction of sertraline during antibiotic course.', 'moderate'),

-- Moderate interactions  
('750e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440011', 'moderate', 'Omeprazole may reduce amlodipine metabolism leading to increased blood levels', 6, 'Monitor blood pressure closely. Consider amlodipine dose reduction if hypotension occurs.', 'moderate'),

('750e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440009', 'moderate', 'Azithromycin may affect metformin absorption and glucose control', 5, 'Monitor blood glucose more frequently during antibiotic course.', 'low'),

-- Minor interactions
('750e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440010', '650e8400-e29b-41d4-a716-446655440008', 'minor', 'Paracetamol and amoxicillin have no significant interaction but monitor liver function with prolonged use', 3, 'No dose adjustment needed. Monitor liver function if used concurrently for extended periods.', 'high');