-- SIHALINK Seed Data
-- Migration 003: Demo/Development Seed Data
-- ALL DATA IN THIS FILE IS FICTIONAL AND FOR DEMONSTRATION PURPOSES ONLY
-- No real doctors, hospitals, or providers are represented

-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings (key, value, description) VALUES
('demo_mode', '{"enabled": true}', 'Demo mode configuration'),
('emergency_dispatch_provider', '{"provider": "mock", "version": "1.0"}', 'Emergency dispatch provider'),
('map_provider', '{"provider": "openstreetmap"}', 'Map provider configuration'),
('max_file_size_mb', '{"value": 50}', 'Maximum file upload size in MB'),
('max_files_per_report', '{"value": 5}', 'Maximum files per emergency report'),
('report_cancellation_window_minutes', '{"value": 5}', 'Window to cancel a submitted report');

-- ============================================================
-- SPECIALTIES
-- ============================================================

INSERT INTO specialties (name_ar, name_fr, name_en, slug, icon) VALUES
('طب عام', 'Médecine générale', 'General Medicine', 'general-medicine', 'stethoscope'),
('طب الطوارئ', 'Médecine d''urgence', 'Emergency Medicine', 'emergency-medicine', 'zap'),
('طب القلب', 'Cardiologie', 'Cardiology', 'cardiology', 'heart'),
('طب الأطفال', 'Pédiatrie', 'Pediatrics', 'pediatrics', 'baby'),
('الجراحة العامة', 'Chirurgie générale', 'General Surgery', 'general-surgery', 'scissors'),
('طب النساء والتوليد', 'Gynécologie-Obstétrique', 'Gynecology & Obstetrics', 'gynecology', 'users'),
('طب العظام', 'Orthopédie', 'Orthopedics', 'orthopedics', 'bone'),
('طب العيون', 'Ophtalmologie', 'Ophthalmology', 'ophthalmology', 'eye'),
('طب الأعصاب', 'Neurologie', 'Neurology', 'neurology', 'brain'),
('طب النفس', 'Psychiatrie', 'Psychiatry', 'psychiatry', 'mind'),
('جلدية', 'Dermatologie', 'Dermatology', 'dermatology', 'shield'),
('طب الأسنان', 'Dentisterie', 'Dentistry', 'dentistry', 'smile'),
('طب الكلى', 'Néphrologie', 'Nephrology', 'nephrology', 'droplet'),
('طب الرئة', 'Pneumologie', 'Pulmonology', 'pulmonology', 'wind'),
('طب الغدد الصماء', 'Endocrinologie', 'Endocrinology', 'endocrinology', 'activity');

-- ============================================================
-- DEMO DOCTORS (fictional - clearly marked)
-- ============================================================

INSERT INTO doctors (
  first_name, last_name, bio_ar, bio_fr, bio_en,
  phone, languages, gender, experience_years,
  consultation_type, consultation_fee, city, wilaya,
  is_verified, is_active, is_demo
) VALUES
(
  'أمين', 'بوعزيز',
   'طبيب عام ذو خبرة واسعة في الطب الوقائي والعلاجي. [بيانات تجريبية]',
  'Médecin généraliste avec vaste expérience. [Données démo]',
  'General practitioner with extensive experience. [Demo data]',
  '+213 21 000 001', ARRAY['ar', 'fr'], 'MALE', 15,
  'BOTH', 1500.00, 'الجزائر العاصمة', 'الجزائر',
  TRUE, TRUE, TRUE
),
(
  'سارة', 'بن علي',
  'طبيبة متخصصة في طب القلب مع خبرة في الحالات الحرجة. [بيانات تجريبية]',
  'Cardiologue spécialisée. [Données démo]',
  'Cardiologist specialized in critical cases. [Demo data]',
  '+213 21 000 002', ARRAY['ar', 'fr', 'en'], 'FEMALE', 12,
  'IN_PERSON', 3000.00, 'الجزائر العاصمة', 'الجزائر',
  TRUE, TRUE, TRUE
),
(
  'كريم', 'حداد',
  'طبيب أطفال متخصص في رعاية حديثي الولادة. [بيانات تجريبية]',
  'Pédiatre spécialisé en néonatologie. [Données démo]',
  'Pediatrician specialized in neonatology. [Demo data]',
  '+213 41 000 001', ARRAY['ar', 'fr'], 'MALE', 10,
  'IN_PERSON', 2000.00, 'وهران', 'وهران',
  TRUE, TRUE, TRUE
),
(
  'فاطمة', 'زهراء',
  'طبيبة عامة في سطيف متاحة للاستشارات عن بعد. [بيانات تجريبية]',
  'Médecin généraliste à Sétif. [Données démo]',
  'General practitioner in Sétif. [Demo data]',
  '+213 36 000 001', ARRAY['ar', 'fr'], 'FEMALE', 8,
  'BOTH', 1200.00, 'سطيف', 'سطيف',
  TRUE, TRUE, TRUE
),
(
  'يوسف', 'مسعود',
  'جراح عام خبير في جراحة الطوارئ. [بيانات تجريبية]',
  'Chirurgien général expert. [Données démo]',
  'General surgeon with emergency expertise. [Demo data]',
  '+213 25 000 001', ARRAY['ar', 'fr'], 'MALE', 20,
  'IN_PERSON', 5000.00, 'قسنطينة', 'قسنطينة',
  TRUE, TRUE, TRUE
);

-- ============================================================
-- DEMO HEALTHCARE FACILITIES
-- ============================================================

INSERT INTO healthcare_facilities (
  name, type, description_ar, city, wilaya,
  latitude, longitude, phone, has_emergency,
  is_verified, is_active, is_demo
) VALUES
(
  'مستشفى الجزائر المركزي [تجريبي]', 'HOSPITAL',
  'مستشفى عام رئيسي - بيانات تجريبية للعرض فقط',
  'الجزائر العاصمة', 'الجزائر',
  36.7538, 3.0588, '+213 21 100 001', TRUE, FALSE, TRUE, TRUE
),
(
  'مستشفى مصطفى باشا [تجريبي]', 'HOSPITAL',
  'مستشفى جامعي - بيانات تجريبية',
  'الجزائر العاصمة', 'الجزائر',
  36.7625, 3.0489, '+213 21 100 002', TRUE, FALSE, TRUE, TRUE
),
(
  'مصحة الشروق [تجريبي]', 'CLINIC',
  'مصحة خاصة متعددة التخصصات - بيانات تجريبية',
  'الجزائر العاصمة', 'الجزائر',
  36.7200, 3.0800, '+213 21 200 001', FALSE, FALSE, TRUE, TRUE
),
(
  'مستشفى وهران الجهوي [تجريبي]', 'HOSPITAL',
  'مستشفى جهوي رئيسي في وهران - بيانات تجريبية',
  'وهران', 'وهران',
  35.6911, -0.6417, '+213 41 300 001', TRUE, FALSE, TRUE, TRUE
),
(
  'مستشفى سطيف [تجريبي]', 'HOSPITAL',
  'مستشفى ولائي سطيف - بيانات تجريبية',
  'سطيف', 'سطيف',
  36.1905, 5.4097, '+213 36 400 001', TRUE, FALSE, TRUE, TRUE
),
(
  'مستشفى قسنطينة [تجريبي]', 'HOSPITAL',
  'مستشفى الجامعي قسنطينة - بيانات تجريبية',
  'قسنطينة', 'قسنطينة',
  36.3650, 6.6147, '+213 31 500 001', TRUE, FALSE, TRUE, TRUE
);

-- ============================================================
-- DEMO PHARMACIES
-- ============================================================

INSERT INTO pharmacies (
  name, phone, address, city, wilaya,
  latitude, longitude, is_24h, is_verified, is_active, is_demo
) VALUES
('صيدلية الأمل [تجريبي]', '+213 21 000 010', 'شارع ديدوش مراد', 'الجزائر العاصمة', 'الجزائر', 36.7560, 3.0590, TRUE, FALSE, TRUE, TRUE),
('صيدلية النور [تجريبي]', '+213 21 000 011', 'شارع بلحة', 'الجزائر العاصمة', 'الجزائر', 36.7400, 3.0450, FALSE, FALSE, TRUE, TRUE),
('صيدلية الشفاء [تجريبي]', '+213 41 000 010', 'شارع الأمير عبد القادر', 'وهران', 'وهران', 35.6950, -0.6380, TRUE, FALSE, TRUE, TRUE),
('صيدلية سطيف مركز [تجريبي]', '+213 36 000 010', 'شارع الاستقلال', 'سطيف', 'سطيف', 36.1920, 5.4100, FALSE, FALSE, TRUE, TRUE),
('صيدلية قسنطينة الكبرى [تجريبي]', '+213 31 000 010', 'ساحة الشهداء', 'قسنطينة', 'قسنطينة', 36.3680, 6.6120, TRUE, FALSE, TRUE, TRUE);

-- ============================================================
-- DEMO LABORATORIES
-- ============================================================

INSERT INTO laboratories (
  name, phone, address, city, wilaya,
  services, requires_appointment, is_verified, is_active, is_demo
) VALUES
('مخبر تحاليل السلامة [تجريبي]', '+213 21 000 020', 'شارع العربي بن مهيدي', 'الجزائر العاصمة', 'الجزائر',
 ARRAY['تحاليل الدم', 'تحاليل البول', 'صورة دم كاملة', 'سكر الدم'], TRUE, FALSE, TRUE, TRUE),
('مخبر وهران [تجريبي]', '+213 41 000 020', 'شارع كورنيش', 'وهران', 'وهران',
 ARRAY['تحاليل الدم', 'PCR', 'تحاليل هرمونية'], TRUE, FALSE, TRUE, TRUE),
('مخبر سطيف الطبي [تجريبي]', '+213 36 000 020', 'شارع 8 مايو', 'سطيف', 'سطيف',
 ARRAY['تحاليل الدم', 'تحاليل البول', 'سكر الدم'], FALSE, FALSE, TRUE, TRUE);

-- ============================================================
-- FIRST AID CATEGORIES
-- ============================================================

INSERT INTO first_aid_categories (slug, name_ar, name_fr, name_en, icon, color, sort_order, is_emergency) VALUES
('cpr', 'الإنعاش القلبي الرئوي', 'RCP', 'CPR', 'heart', '#DC2626', 1, TRUE),
('choking', 'الاختناق', 'Étouffement', 'Choking', 'wind', '#EA580C', 2, TRUE),
('bleeding', 'النزيف الشديد', 'Saignement', 'Severe Bleeding', 'droplets', '#DC2626', 3, TRUE),
('burns', 'الحروق', 'Brûlures', 'Burns', 'flame', '#EA580C', 4, FALSE),
('fractures', 'الكسور', 'Fractures', 'Fractures', 'bone', '#D97706', 5, FALSE),
('fainting', 'الإغماء', 'Évanouissement', 'Fainting', 'user', '#16A34A', 6, FALSE),
('seizures', 'النوبات التشنجية', 'Convulsions', 'Seizures', 'zap', '#EA580C', 7, TRUE),
('poisoning', 'التسمم', 'Empoisonnement', 'Poisoning', 'skull', '#DC2626', 8, TRUE),
('heatstroke', 'ضربة الشمس', 'Coup de chaleur', 'Heatstroke', 'sun', '#EA580C', 9, FALSE),
('hypothermia', 'انخفاض حرارة الجسم', 'Hypothermie', 'Hypothermia', 'snowflake', '#3B82F6', 10, FALSE),
('allergic-reaction', 'الحساسية الشديدة', 'Réaction allergique', 'Allergic Reaction', 'shield', '#DC2626', 11, TRUE),
('cardiac', 'الطوارئ القلبية', 'Urgence cardiaque', 'Cardiac Emergency', 'heart', '#DC2626', 12, TRUE);

-- ============================================================
-- FIRST AID GUIDES
-- ============================================================

INSERT INTO first_aid_guides (
  category_id, slug, title_ar, title_fr, title_en,
  warning_ar, warning_fr, warning_en,
  when_to_call_ar, when_to_call_fr, when_to_call_en,
  do_not_do_ar, do_not_do_fr, do_not_do_en,
  source, review_status, reviewed_at
) VALUES
(
  (SELECT id FROM first_aid_categories WHERE slug = 'cpr'),
  'cpr-adult',
  'الإنعاش القلبي الرئوي للبالغين',
  'RCP pour adultes',
  'CPR for Adults',
  '⚠️ هذه المعلومات للتوجيه فقط وليست بديلاً عن التدريب الطبي المتخصص. اتصل بالطوارئ فوراً.',
  '⚠️ Ces informations sont à titre indicatif uniquement. Appelez les urgences immédiatement.',
  '⚠️ This information is for guidance only. Call emergency services immediately.',
  'اتصل بالطوارئ فور فقدان الشخص للوعي أو توقف تنفسه. لا تتأخر.',
  'Appelez les urgences dès que la personne perd connaissance ou ne respire plus.',
  'Call emergency services immediately when the person loses consciousness or stops breathing.',
  'لا تحرك الشخص إذا كان هناك شك في إصابة بالعمود الفقري. لا تضغط على الصدر بقوة مفرطة.',
  'Ne déplacez pas la personne si une blessure à la colonne vertébrale est suspectée.',
  'Do not move the person if spinal injury is suspected. Do not compress too hard.',
  'Red Cross / Croix Rouge',
  'PUBLISHED',
  '2025-01-01'
),
(
  (SELECT id FROM first_aid_categories WHERE slug = 'choking'),
  'choking-adult',
  'التعامل مع الاختناق لدى البالغين',
  'Étouffement chez l''adulte',
  'Choking in Adults',
  '⚠️ الاختناق حالة طارئة تهدد الحياة. تصرف بسرعة واتصل بالطوارئ.',
  '⚠️ L''étouffement est une urgence vitale. Agissez rapidement.',
  '⚠️ Choking is a life-threatening emergency. Act quickly.',
  'اتصل بالطوارئ فوراً إذا فشلت المناورة بعد محاولتين أو فقد الشخص الوعي.',
  'Appelez les urgences si la manœuvre échoue ou si la personne perd connaissance.',
  'Call emergency services if maneuver fails or person loses consciousness.',
  'لا تضرب ظهر الشخص وهو يسعل بقوة. لا تحاول إخراج الجسم الغريب بأصابعك إلا إذا رأيته.',
  'Ne frappez pas dans le dos si la personne tousse fort. Ne cherchez pas l''objet avec vos doigts.',
  'Do not slap back if person is coughing forcefully. Do not do blind finger sweeps.',
  'Red Cross / Croix Rouge',
  'PUBLISHED',
  '2025-01-01'
),
(
  (SELECT id FROM first_aid_categories WHERE slug = 'bleeding'),
  'severe-bleeding',
  'إيقاف النزيف الشديد',
  'Arrêter un saignement grave',
  'Stopping Severe Bleeding',
  '⚠️ النزيف الحاد خطير ويمكن أن يكون مميتاً. اتصل بالطوارئ فوراً.',
  '⚠️ Un saignement abondant est dangereux. Appelez les urgences.',
  '⚠️ Severe bleeding is dangerous and potentially fatal. Call emergency services immediately.',
  'اتصل بالطوارئ فوراً في حالة النزيف الغزير أو الجرح العميق.',
  'Appelez les urgences immédiatement en cas de saignement abondant ou de plaie profonde.',
  'Call emergency services immediately for heavy bleeding or deep wounds.',
  'لا تنزع الضمادة إذا نفذت الدم — أضف طبقة أخرى فوقها. لا تضع العاصبة على مفاصل.',
  'Ne retirez pas le pansement s''il est imbibé — ajoutez une couche par-dessus.',
  'Do not remove soaked dressing — add a layer on top. Do not apply tourniquet on joints.',
  'Red Cross / Croix Rouge',
  'PUBLISHED',
  '2025-01-01'
);

-- ============================================================
-- FIRST AID STEPS
-- ============================================================

-- CPR Steps
INSERT INTO first_aid_steps (guide_id, step_number, title_ar, title_fr, title_en, description_ar, description_fr, description_en, is_critical)
SELECT
  g.id,
  s.step_number,
  s.title_ar, s.title_fr, s.title_en,
  s.desc_ar, s.desc_fr, s.desc_en,
  s.is_critical
FROM first_aid_guides g
CROSS JOIN (
  VALUES
  (1, 'تحقق من السلامة', 'Vérifiez la sécurité', 'Check Safety',
   'تأكد من سلامة المنطقة المحيطة لك وللمصاب قبل الاقتراب.', 'Assurez-vous que la zone est sûre.', 'Ensure the area is safe for you and the victim.', false),
  (2, 'تحقق من الاستجابة', 'Vérifiez la réponse', 'Check Response',
   'انقر على كتفي الشخص وقل بصوت عالٍ: هل أنت بخير؟', 'Tapotez les épaules et dites fort: Ça va?', 'Tap shoulders firmly and ask loudly: Are you OK?', true),
  (3, 'اتصل بالطوارئ', 'Appelez les urgences', 'Call Emergency',
   'اتصل أو اطلب من شخص آخر الاتصال بالطوارئ فوراً. لا تتركه وحده.', 'Appelez ou faites appeler les secours immédiatement.', 'Call or ask someone to call emergency services immediately.', true),
  (4, 'ابدأ ضغط الصدر', 'Commencez les compressions', 'Begin Chest Compressions',
   'ضع كعب يدك على مركز الصدر. ضع يدك الأخرى فوقها. اضغط بعمق 5-6 سم بمعدل 100-120 ضغطة/دقيقة.', 'Placez le talon de votre main au centre de la poitrine. Comprimez de 5-6 cm, 100-120 fois/min.', 'Place heel of hand on center of chest. Push down 5-6cm at 100-120 compressions/min.', true),
  (5, 'أعطِ التنفس الاصطناعي (إذا كنت مدرباً)', 'Ventilations de secours (si formé)', 'Rescue Breaths (if trained)',
   'بعد 30 ضغطة، أعطِ نفسين تنفسيين إذا كنت مدرباً. إذا لم تكن متدرباً، استمر في الضغط فقط.', 'Après 30 compressions, donnez 2 insufflations si vous êtes formé.', 'After 30 compressions, give 2 rescue breaths if trained. If not trained, continue compressions only.', false)
) AS s(step_number, title_ar, title_fr, title_en, desc_ar, desc_fr, desc_en, is_critical)
WHERE g.slug = 'cpr-adult';

-- Choking Steps
INSERT INTO first_aid_steps (guide_id, step_number, title_ar, title_fr, title_en, description_ar, description_fr, description_en, is_critical)
SELECT
  g.id,
  s.step_number,
  s.title_ar, s.title_fr, s.title_en,
  s.desc_ar, s.desc_fr, s.desc_en,
  s.is_critical
FROM first_aid_guides g
CROSS JOIN (
  VALUES
  (1, 'شجع على السعال', 'Encouragez la toux', 'Encourage Coughing',
   'إذا كان الشخص يسعل بقوة، شجعه على الاستمرار. لا تتدخل.', 'Si la personne tousse fort, encouragez-la à continuer.', 'If the person is coughing forcefully, encourage them to continue.', false),
  (2, 'اتصل بالطوارئ إذا تعذر السعال', 'Appelez si la toux est inefficace', 'Call if cough is ineffective',
   'إذا لم يستطع الشخص السعال أو التنفس أو الكلام، اتصل بالطوارئ فوراً.', 'Si la personne ne peut pas tousser/respirer/parler, appelez les secours.', 'If person cannot cough/breathe/speak, call emergency services immediately.', true),
  (3, 'أعطِ 5 ضربات على الظهر', '5 tapes dans le dos', '5 Back Blows',
   'انحنِ الشخص للأمام. أعطِ 5 ضربات قوية بين لوحي الكتف بكعب يدك.', 'Penchez la personne en avant. Donnez 5 coups fermes entre les omoplates.', 'Lean person forward. Give 5 firm back blows between shoulder blades.', true),
  (4, 'مناورة هيمليك', 'Manœuvre de Heimlich', 'Heimlich Maneuver',
   'قف خلف الشخص. ضع يديك حول خصره. اضغط للداخل وللأعلى بقوة 5 مرات.', 'Placez-vous derrière. Entourez la taille. Poussez vers l''intérieur et vers le haut 5 fois.', 'Stand behind. Place hands around waist. Thrust inward and upward 5 times.', true),
  (5, 'كرر حتى تحرر المجرى الهوائي', 'Répétez jusqu''à dégagement', 'Repeat until airway is clear',
   'بادل بين 5 ضربات ظهر و5 ضغطات بطنية حتى يخرج الجسم الغريب أو يفقد الشخص الوعي.', 'Alternez 5 tapes/5 compressions jusqu''à dégagement ou perte de conscience.', 'Alternate 5 back blows/5 abdominal thrusts until object is expelled or person loses consciousness.', true)
) AS s(step_number, title_ar, title_fr, title_en, desc_ar, desc_fr, desc_en, is_critical)
WHERE g.slug = 'choking-adult';

-- Bleeding Steps
INSERT INTO first_aid_steps (guide_id, step_number, title_ar, title_fr, title_en, description_ar, description_fr, description_en, is_critical)
SELECT
  g.id,
  s.step_number,
  s.title_ar, s.title_fr, s.title_en,
  s.desc_ar, s.desc_fr, s.desc_en,
  s.is_critical
FROM first_aid_guides g
CROSS JOIN (
  VALUES
  (1, 'اتصل بالطوارئ', 'Appelez les urgences', 'Call Emergency',
   'في حالة النزيف الغزير اتصل فوراً بالطوارئ ولا تترك الشخص.', 'En cas de saignement abondant, appelez immédiatement les urgences.', 'In case of heavy bleeding, call emergency services immediately.', true),
  (2, 'ارتدِ القفازات إذا أمكن', 'Portez des gants si possible', 'Wear gloves if possible',
   'استخدم قفازات طبية إذا توفرت لحماية نفسك وللمصاب.', 'Utilisez des gants médicaux si disponibles pour vous protéger.', 'Use medical gloves if available to protect yourself.', false),
  (3, 'اضغط على الجرح', 'Appuyez sur la plaie', 'Apply pressure',
   'اضغط بضمادة نظيفة أو قطعة قماش نظيفة على الجرح بشكل مستمر ومتواصل.', 'Appuyez fermement avec un pansement propre sur la plaie.', 'Press firmly with a clean bandage or cloth on the wound continuously.', true),
  (4, 'حافظ على الضغط', 'Maintenez la pression', 'Maintain pressure',
   'حافظ على الضغط المستمر لمدة لا تقل عن 10 دقائق. لا ترفع الضمادة للتحقق.', 'Maintenez une pression constante pendant au moins 10 minutes.', 'Maintain constant pressure for at least 10 minutes. Do not lift to check.', true),
  (5, 'ارفع الطرف المصاب', 'Élevez le membre blessé', 'Elevate injured limb',
   'إذا أمكن، ارفع الطرف المصاب فوق مستوى القلب لتقليل النزيف.', 'Si possible, élevez le membre blessé au-dessus du niveau du cœur.', 'If possible, raise injured limb above heart level to reduce bleeding.', false)
) AS s(step_number, title_ar, title_fr, title_en, desc_ar, desc_fr, desc_en, is_critical)
WHERE g.slug = 'severe-bleeding';
