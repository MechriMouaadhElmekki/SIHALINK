-- ============================================================
-- SIHALINK Seed: First Aid Content
-- INFORMATIONAL ONLY - Not a substitute for professional care
-- Content marked as draft - requires medical professional review
-- ============================================================
INSERT INTO first_aid_categories (slug, name_ar, name_fr, name_en, sort_order) VALUES
  ('cpr', 'الإنعاش القلبي الرئوي', 'RCP', 'CPR', 1),
  ('choking', 'الاختناق', 'Étouffement', 'Choking', 2),
  ('bleeding', 'النزيف', 'Saignement', 'Bleeding', 3),
  ('burns', 'الحروق', 'Brûlures', 'Burns', 4),
  ('fractures', 'الكسور', 'Fractures', 'Fractures', 5),
  ('fainting', 'الإغماء', 'Évanouissement', 'Fainting', 6),
  ('seizures', 'النوبات', 'Crises épileptiques', 'Seizures', 7),
  ('poisoning', 'التسمم', 'Empoisonnement', 'Poisoning', 8),
  ('heatstroke', 'ضربة الشمس', 'Coup de chaleur', 'Heatstroke', 9),
  ('heart', 'أزمة قلبية', 'Urgence cardiaque', 'Heart Emergency', 10)
ON CONFLICT (slug) DO NOTHING;

-- CPR Guide
INSERT INTO first_aid_guides (
  category_id, slug, title_ar, title_fr, title_en,
  warning_ar, warning_fr, warning_en,
  call_emergency_when_ar, call_emergency_when_fr, call_emergency_when_en,
  do_not_do_ar, do_not_do_fr, do_not_do_en,
  source, review_status, is_published
) SELECT
  c.id,
  'cpr-basic',
  'الإنعاش القلبي الرئوي للبالغين',
  'RCP de base pour adultes',
  'Basic CPR for Adults',
  'هذه المعلومات للتوجيه فقط وليست بديلاً عن التدريب الطبي المتخصص. اتصل بالإسعاف فوراً.',
  'Ces informations sont indicatives uniquement. Appelez le SAMU immédiatement.',
  'This information is for guidance only. Call emergency services immediately.',
  'إذا كان الشخص فاقداً للوعي ولا يتنفس بشكل طبيعي',
  'Si la personne est inconsciente et ne respire pas normalement',
  'If the person is unconscious and not breathing normally',
  'لا تترك الشخص وحده. لا توقف الإنعاش حتى يصل المسعفون.',
  'Ne laissez pas la personne seule. Ne cessez pas la RCP jusqu''\'à l\'arrivée des secours.',
  'Do not leave the person alone. Do not stop CPR until help arrives.',
  'American Heart Association - For guidance only',
  'draft',
  TRUE
FROM first_aid_categories c WHERE c.slug = 'cpr';
