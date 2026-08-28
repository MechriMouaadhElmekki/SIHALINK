-- ============================================================
-- SIHALINK Seed: Laboratories (Demo Data)
-- All records marked is_demo=TRUE - FICTIONAL DATA
-- ============================================================
INSERT INTO laboratories (name, address, city, wilaya, phone, services, is_verified, is_demo) VALUES
  ('مخبر التحليل الطبي [تجريبي]', 'شارع ديدوش مراد', 'الجزائر العاصمة', 'الجزائر', '021200001', ARRAY['تحاليل الدم','تحاليل البول','الكيمياء الحيوية'], TRUE, TRUE),
  ('مخبر سطيف [تجريبي]', 'حي المقاومة', 'سطيف', 'سطيف', '036200001', ARRAY['تحاليل الدم','الجرثومية'], TRUE, TRUE),
  ('مخبر قسنطينة [تجريبي]', 'حي السواقي', 'قسنطينة', 'قسنطينة', '031200001', ARRAY['تحاليل الدم','الهرمونات'], TRUE, TRUE)
ON CONFLICT DO NOTHING;
