-- ============================================================
-- SIHALINK Seed: Healthcare Facilities (Demo Data - Algeria)
-- All records marked is_demo=TRUE
-- These are FICTIONAL facilities for demo purposes only
-- ============================================================
INSERT INTO healthcare_facilities (name, type, description, phone, address, city, wilaya, latitude, longitude, has_emergency, is_verified, is_demo, verification_status) VALUES
  ('مستشفى مصطفى باشا [تجريبي]', 'hospital', 'مستشفى عام للتجريب فقط', '021000001', 'شارع الاستقلال', 'الجزائر العاصمة', 'الجزائر', 36.7372, 3.0865, TRUE, TRUE, TRUE, 'verified'),
  ('مستشفى فرانتز فانون [تجريبي]', 'hospital', 'مستشفى عام للتجريب فقط', '025000001', 'شارع الثورة', 'البليدة', 'البليدة', 36.4703, 2.8277, TRUE, TRUE, TRUE, 'verified'),
  ('مستشفى سطيف [تجريبي]', 'hospital', 'مستشفى عام للتجريب فقط', '036000001', 'طريق قسنطينة', 'سطيف', 'سطيف', 36.1898, 5.4104, TRUE, TRUE, TRUE, 'verified'),
  ('مستشفى ابن باديس [تجريبي]', 'hospital', 'مستشفى عام للتجريب فقط', '031000001', 'شارع الإخوة عيسى', 'قسنطينة', 'قسنطينة', 36.3650, 6.6147, TRUE, TRUE, TRUE, 'verified'),
  ('مستشفى عبان رمضان [تجريبي]', 'hospital', 'مستشفى عام للتجريب فقط', '034000001', 'شارع أول نوفمبر', 'بجاية', 'بجاية', 36.7509, 5.0567, FALSE, TRUE, TRUE, 'verified'),
  ('عيادة النور [تجريبي]', 'clinic', 'عيادة خاصة للتجريب فقط', '021000002', 'حي باب الزوار', 'الجزائر العاصمة', 'الجزائر', 36.7200, 3.1200, FALSE, TRUE, TRUE, 'verified'),
  ('مركز صحي وهران [تجريبي]', 'health_center', 'مركز صحي للتجريب فقط', '041000001', 'شارع لارب رونبو', 'وهران', 'وهران', 35.6972, 0.6333, FALSE, TRUE, TRUE, 'verified')
ON CONFLICT DO NOTHING;
