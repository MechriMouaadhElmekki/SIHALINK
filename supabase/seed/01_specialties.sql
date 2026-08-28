-- ============================================================
-- SIHALINK Seed: Medical Specialties
-- ============================================================
INSERT INTO specialties (id, name_ar, name_fr, name_en) VALUES
  (uuid_generate_v4(), 'طب عام', 'Médecine générale', 'General Medicine'),
  (uuid_generate_v4(), 'طب القلب', 'Cardiologie', 'Cardiology'),
  (uuid_generate_v4(), 'طب الأطفال', 'Pédiatrie', 'Pediatrics'),
  (uuid_generate_v4(), 'طب النساء والتوليد', 'Gynécologie-Obstétrique', 'Gynecology & Obstetrics'),
  (uuid_generate_v4(), 'جراحة عامة', 'Chirurgie générale', 'General Surgery'),
  (uuid_generate_v4(), 'طب العيون', 'Ophtalmologie', 'Ophthalmology'),
  (uuid_generate_v4(), 'طب الأسنان', 'Dentisterie', 'Dentistry'),
  (uuid_generate_v4(), 'طب الأعصاب', 'Neurologie', 'Neurology'),
  (uuid_generate_v4(), 'طب الروماتيزم', 'Rhumatologie', 'Rheumatology'),
  (uuid_generate_v4(), 'أمراض الجلد', 'Dermatologie', 'Dermatology'),
  (uuid_generate_v4(), 'طب الأنف والأذن والحنجرة', 'ORL', 'ENT'),
  (uuid_generate_v4(), 'طب الطوارئ', 'Médecine d\'urgence', 'Emergency Medicine'),
  (uuid_generate_v4(), 'طب الصدر', 'Pneumologie', 'Pulmonology'),
  (uuid_generate_v4(), 'طب الغدد الصماء', 'Endocrinologie', 'Endocrinology'),
  (uuid_generate_v4(), 'جراحة العظام', 'Orthopédie', 'Orthopedics')
ON CONFLICT DO NOTHING;
