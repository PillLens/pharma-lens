-- Insert sample medication data for testing and demo purposes
INSERT INTO products (brand_name, generic_name, strength, form, manufacturer, country_code, atc_code) VALUES
('Panadol', 'Paracetamol', '500mg', 'Tablet', 'GSK', 'AZ', 'N02BE01'),
('Aspirin', 'Acetylsalicylic Acid', '100mg', 'Tablet', 'Bayer', 'AZ', 'N02BA01'),
('Nurofen', 'Ibuprofen', '400mg', 'Tablet', 'Reckitt Benckiser', 'AZ', 'M01AE01'),
('Augmentin', 'Amoxicillin/Clavulanic Acid', '625mg', 'Tablet', 'GSK', 'AZ', 'J01CR02'),
('Sumamed', 'Azithromycin', '250mg', 'Tablet', 'Pfizer', 'AZ', 'J01FA10'),
('Voltaren', 'Diclofenac', '50mg', 'Tablet', 'Novartis', 'AZ', 'M01AB05'),
('Citramon P', 'Paracetamol/Aspirin/Caffeine', '320mg/240mg/40mg', 'Tablet', 'Pharmstandard', 'AZ', 'N02BA51'),
('Analgin', 'Metamizole', '500mg', 'Tablet', 'Various', 'AZ', 'N02BB02')
ON CONFLICT (brand_name, generic_name, strength, form, manufacturer) DO NOTHING;