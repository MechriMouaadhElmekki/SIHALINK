-- ============================================================
-- SIHALINK Seed: Pharmacies (Demo Data)
-- All records marked is_demo=TRUE - FICTIONAL DATA
-- ============================================================
INSERT INTO pharmacies (name, address, city, wilaya, phone, has_24h_service, is_verified, is_demo) VALUES
  ('صيدلية الشفاء [تجريبي]', 'شارع ديدوش مراد', 'الجزائر العاصمة', 'الجزائر', '021100001', TRUE, TRUE, TRUE),
  ('صيدلية الأمل [تجريبي]', 'حي المقاومة', 'سطيف', 'سطيف', '036100001', FALSE, TRUE, TRUE),
  ('صيدلية الصحة [تجريبي]', 'شارع الإخوة بوزيدي', 'قسنطينة', 'قسنطينة', '031100001', TRUE, TRUE, TRUE),
  ('صيدلية الرعاية [تجريبي]', 'حي ابن الطفيل', 'وهران', 'وهران', '041100001', FALSE, TRUE, TRUE),
  ('صيدلية الحياة [تجريبي]', 'شارع العربي بن مهيدي', 'بجاية', 'بجاية', '034100001', FALSE, TRUE, TRUE)
ON CONFLICT DO NOTHING;
