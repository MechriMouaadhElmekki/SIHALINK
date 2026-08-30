-- ============================================================
-- SIHALINK Seed Data - Migration 004
-- Demo/test data for Algeria
-- ALL DATA IS FICTIONAL - for demo purposes only
-- ============================================================

-- ============================================================
-- SPECIALTIES
-- ============================================================
INSERT INTO specialties (id, name_ar, name_fr, name_en, icon) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'طب عام', 'Médecine générale', 'General Medicine', 'stethoscope'),
  ('a1000000-0000-0000-0000-000000000002', 'طب الأطفال', 'Pédiatrie', 'Pediatrics', 'baby'),
  ('a1000000-0000-0000-0000-000000000003', 'أمراض القلب', 'Cardiologie', 'Cardiology', 'heart'),
  ('a1000000-0000-0000-0000-000000000004', 'طب العيون', 'Ophtalmologie', 'Ophthalmology', 'eye'),
  ('a1000000-0000-0000-0000-000000000005', 'الجراحة العامة', 'Chirurgie générale', 'General Surgery', 'scissors'),
  ('a1000000-0000-0000-0000-000000000006', 'أمراض النساء والتوليد', 'Gynécologie-obstétrique', 'Gynecology & Obstetrics', 'activity'),
  ('a1000000-0000-0000-0000-000000000007', 'طب الأسنان', 'Dentisterie', 'Dentistry', 'smile'),
  ('a1000000-0000-0000-0000-000000000008', 'أمراض العظام', 'Orthopédie', 'Orthopedics', 'bone'),
  ('a1000000-0000-0000-0000-000000000009', 'الأمراض الجلدية', 'Dermatologie', 'Dermatology', 'shield'),
  ('a1000000-0000-0000-0000-000000000010', 'الطب النفسي', 'Psychiatrie', 'Psychiatry', 'brain'),
  ('a1000000-0000-0000-0000-000000000011', 'طب الطوارئ', 'Médecine d''urgence', 'Emergency Medicine', 'alert-circle'),
  ('a1000000-0000-0000-0000-000000000012', 'أمراض الجهاز الهضمي', 'Gastroentérologie', 'Gastroenterology', 'activity')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- HEALTHCARE FACILITIES (Demo - Fictional)
-- ============================================================
INSERT INTO healthcare_facilities (id, name, facility_type, description, phone, address, city, wilaya, latitude, longitude, has_emergency, is_verified, is_demo) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'مستشفى مصطفى باشا التجريبي [ديمو]', 'hospital', 'مستشفى تجريبي - بيانات ديمو فقط', '+213-21-000001', 'شارع الاستقلال', 'الجزائر العاصمة', 'الجزائر', 36.7372, 3.0865, true, false, true),
  ('b1000000-0000-0000-0000-000000000002', 'عيادة الأمل التجريبية [ديمو]', 'clinic', 'عيادة تجريبية - بيانات ديمو فقط', '+213-21-000002', 'حي باب الواد', 'الجزائر العاصمة', 'الجزائر', 36.7523, 3.0471, false, false, true),
  ('b1000000-0000-0000-0000-000000000003', 'مستشفى سيدي بلعباس التجريبي [ديمو]', 'hospital', 'مستشفى تجريبي - بيانات ديمو فقط', '+213-48-000001', 'شارع الجيش', 'سيدي بلعباس', 'سيدي بلعباس', 35.1897, -0.6308, true, false, true),
  ('b1000000-0000-0000-0000-000000000004', 'المستشفى الجامعي قسنطينة [ديمو]', 'hospital', 'مستشفى تجريبي - بيانات ديمو فقط', '+213-31-000001', 'شارع 1 نوفمبر', 'قسنطينة', 'قسنطينة', 36.3650, 6.6147, true, false, true),
  ('b1000000-0000-0000-0000-000000000005', 'مركز الأمومة والطفولة سطيف [ديمو]', 'medical_center', 'مركز طبي تجريبي - بيانات ديمو فقط', '+213-36-000001', 'حي 8 ماي 1945', 'سطيف', 'سطيف', 36.1897, 5.4139, false, false, true),
  ('b1000000-0000-0000-0000-000000000006', 'مستشفى فرانس فانون البليدة [ديمو]', 'hospital', 'مستشفى تجريبي - بيانات ديمو فقط', '+213-25-000001', 'شارع العربي بن مهيدي', 'البليدة', 'البليدة', 36.4698, 2.8281, true, false, true),
  ('b1000000-0000-0000-0000-000000000007', 'مستشفى وهران الجامعي [ديمو]', 'hospital', 'مستشفى تجريبي - بيانات ديمو فقط', '+213-41-000001', 'شارع لاروس', 'وهران', 'وهران', 35.6969, -0.6331, true, false, true),
  ('b1000000-0000-0000-0000-000000000008', 'مركز طوارئ عنابة [ديمو]', 'emergency_department', 'قسم طوارئ تجريبي - بيانات ديمو فقط', '+213-38-000001', 'حي الحجار', 'عنابة', 'عنابة', 36.9000, 7.7667, true, false, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DOCTORS (Demo - Completely Fictional)
-- ============================================================
INSERT INTO doctors (id, first_name, last_name, bio_ar, languages, gender, years_experience, city, wilaya, consultation_type, is_verified, is_active, is_demo, rating) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'أحمد [ديمو]', 'بن عمر', 'طبيب عام متخصص في طب الأسرة - بيانات تجريبية فقط، غير حقيقي', ARRAY['ar','fr'], 'male', 12, 'الجزائر العاصمة', 'الجزائر', ARRAY['in_person','video'], false, true, true, 4.5),
  ('c1000000-0000-0000-0000-000000000002', 'فاطمة [ديمو]', 'حمدي', 'طبيبة أطفال متخصصة - بيانات تجريبية فقط، غير حقيقية', ARRAY['ar','fr','en'], 'female', 8, 'الجزائر العاصمة', 'الجزائر', ARRAY['in_person','home_visit'], false, true, true, 4.8),
  ('c1000000-0000-0000-0000-000000000003', 'كريم [ديمو]', 'مزياني', 'طبيب قلب - بيانات تجريبية فقط، غير حقيقي', ARRAY['ar','fr'], 'male', 15, 'وهران', 'وهران', ARRAY['in_person'], false, true, true, 4.3),
  ('c1000000-0000-0000-0000-000000000004', 'سارة [ديمو]', 'بلقاسم', 'طبيبة نساء وتوليد - بيانات تجريبية فقط، غير حقيقية', ARRAY['ar','fr'], 'female', 10, 'سطيف', 'سطيف', ARRAY['in_person','video'], false, true, true, 4.7),
  ('c1000000-0000-0000-0000-000000000005', 'يوسف [ديمو]', 'تيزي', 'جراح عام - بيانات تجريبية فقط، غير حقيقي', ARRAY['ar','fr','en'], 'male', 20, 'قسنطينة', 'قسنطينة', ARRAY['in_person'], false, true, true, 4.6)
ON CONFLICT (id) DO NOTHING;

-- Link doctor specialties
INSERT INTO doctor_specialties (doctor_id, specialty_id, is_primary) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', true),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', true),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', true),
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', true),
  ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', true)
ON CONFLICT (doctor_id, specialty_id) DO NOTHING;

-- Doctor availability (Sunday=0 to Saturday=6)
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000001', 0, '08:00', '12:00', 30, true),
  ('c1000000-0000-0000-0000-000000000001', 1, '08:00', '12:00', 30, true),
  ('c1000000-0000-0000-0000-000000000001', 2, '14:00', '18:00', 30, true),
  ('c1000000-0000-0000-0000-000000000002', 0, '09:00', '13:00', 30, true),
  ('c1000000-0000-0000-0000-000000000002', 3, '14:00', '17:00', 30, true),
  ('c1000000-0000-0000-0000-000000000003', 1, '08:00', '14:00', 45, true),
  ('c1000000-0000-0000-0000-000000000003', 4, '08:00', '14:00', 45, true),
  ('c1000000-0000-0000-0000-000000000004', 2, '09:00', '12:00', 30, true),
  ('c1000000-0000-0000-0000-000000000004', 4, '09:00', '12:00', 30, true),
  ('c1000000-0000-0000-0000-000000000005', 0, '07:00', '13:00', 60, true),
  ('c1000000-0000-0000-0000-000000000005', 3, '07:00', '13:00', 60, true);

-- ============================================================
-- PHARMACIES (Demo)
-- ============================================================
INSERT INTO pharmacies (name, phone, address, city, wilaya, latitude, longitude, is_24h, services, is_demo) VALUES
  ('صيدلية النور [ديمو]', '+213-21-111001', 'شارع ديدوش مراد', 'الجزائر العاصمة', 'الجزائر', 36.7450, 3.0580, false, ARRAY['prescription','otc','cosmetics'], true),
  ('صيدلية الشفاء [ديمو]', '+213-21-111002', 'حي بلكور', 'الجزائر العاصمة', 'الجزائر', 36.7321, 3.0867, true, ARRAY['prescription','otc','home_delivery'], true),
  ('صيدلية الأمل وهران [ديمو]', '+213-41-111001', 'شارع شيش', 'وهران', 'وهران', 35.6998, -0.6365, false, ARRAY['prescription','otc'], true),
  ('صيدلية سطيف المركزية [ديمو]', '+213-36-111001', 'ساحة الاستقلال', 'سطيف', 'سطيف', 36.1911, 5.4133, false, ARRAY['prescription','otc','vitamins'], true),
  ('صيدلية قسنطينة 24/7 [ديمو]', '+213-31-111001', 'حي السندباد', 'قسنطينة', 'قسنطينة', 36.3640, 6.6140, true, ARRAY['prescription','otc','home_delivery'], true);

-- ============================================================
-- LABORATORIES (Demo)
-- ============================================================
INSERT INTO laboratories (name, phone, address, city, wilaya, latitude, longitude, services, is_demo) VALUES
  ('مخبر التحاليل الطبية النور [ديمو]', '+213-21-222001', 'شارع بن مهيدي', 'الجزائر العاصمة', 'الجزائر', 36.7480, 3.0530, ARRAY['blood_tests','urine_tests','bacteriology','serology'], true),
  ('مخبر الشفاء وهران [ديمو]', '+213-41-222001', 'حي المنزه', 'وهران', 'وهران', 35.6945, -0.6412, ARRAY['blood_tests','imaging','ecg'], true),
  ('مخبر سطيف الطبي [ديمو]', '+213-36-222001', 'شارع عمار بن زكري', 'سطيف', 'سطيف', 36.1875, 5.4088, ARRAY['blood_tests','urine_tests','parasitology'], true),
  ('مخبر قسنطينة المتخصص [ديمو]', '+213-31-222001', 'حي 5 جويلية', 'قسنطينة', 'قسنطينة', 36.3658, 6.6152, ARRAY['blood_tests','genetics','hormonology'], true);

-- ============================================================
-- FIRST AID CATEGORIES
-- ============================================================
INSERT INTO first_aid_categories (id, name_ar, name_fr, name_en, icon, color, sort_order) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'الإنعاش القلبي الرئوي (CPR)', 'Réanimation cardio-pulmonaire (RCP)', 'CPR', 'heart', '#DC2626', 1),
  ('d1000000-0000-0000-0000-000000000002', 'الاختناق', 'Étouffement', 'Choking', 'wind', '#EA580C', 2),
  ('d1000000-0000-0000-0000-000000000003', 'النزيف', 'Saignement', 'Bleeding', 'droplets', '#DC2626', 3),
  ('d1000000-0000-0000-0000-000000000004', 'الحروق', 'Brûlures', 'Burns', 'flame', '#D97706', 4),
  ('d1000000-0000-0000-0000-000000000005', 'الكسور', 'Fractures', 'Fractures', 'bone', '#2563EB', 5),
  ('d1000000-0000-0000-0000-000000000006', 'الإغماء', 'Évanouissement', 'Fainting', 'user-x', '#7C3AED', 6),
  ('d1000000-0000-0000-0000-000000000007', 'النوبات التشنجية', 'Convulsions', 'Seizures', 'zap', '#DC2626', 7),
  ('d1000000-0000-0000-0000-000000000008', 'التسمم', 'Empoisonnement', 'Poisoning', 'skull', '#991B1B', 8),
  ('d1000000-0000-0000-0000-000000000009', 'ضربة الشمس', 'Coup de chaleur', 'Heatstroke', 'sun', '#B45309', 9),
  ('d1000000-0000-0000-0000-000000000010', 'الحساسية الشديدة', 'Réaction allergique', 'Allergic Reaction', 'shield-alert', '#DC2626', 10),
  ('d1000000-0000-0000-0000-000000000011', 'نوبة قلبية', 'Crise cardiaque', 'Heart Attack', 'heart-crack', '#991B1B', 11),
  ('d1000000-0000-0000-0000-000000000012', 'انخفاض درجة الحرارة', 'Hypothermie', 'Hypothermia', 'thermometer-snowflake', '#1D4ED8', 12)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FIRST AID GUIDES (CPR + Bleeding — full examples)
-- ============================================================
INSERT INTO first_aid_guides (id, category_id, title_ar, title_fr, title_en, warning_ar, warning_fr, warning_en, when_to_call_ar, when_to_call_fr, when_to_call_en, do_not_do_ar, do_not_do_fr, do_not_do_en, source, review_status, version, is_published) VALUES
  ('e1000000-0000-0000-0000-000000000001',
   'd1000000-0000-0000-0000-000000000001',
   'كيفية إجراء الإنعاش القلبي الرئوي للبالغين',
   'Comment effectuer la RCP sur un adulte',
   'How to Perform CPR on an Adult',
   '⚠️ هذه المعلومات للتوجيه العام فقط. يجب الحصول على تدريب معتمد على الإسعاف الأولي.',
   '⚠️ Ces informations sont à titre indicatif uniquement. Une formation certifiée en premiers secours est recommandée.',
   '⚠️ This information is for general guidance only. Certified first aid training is strongly recommended.',
   'اتصل بالطوارئ فوراً إذا كان الشخص فاقد الوعي ولا يتنفس، أو إذا لم تستجب لمحاولاتك',
   'Appelez immédiatement les secours si la personne est inconsciente et ne respire pas',
   'Call emergency services immediately if the person is unconscious and not breathing',
   'لا تترك المريض وحيداً. لا تضغط على البطن. لا تكن عنيفاً في الضغط',
   'Ne laissez pas le patient seul. Ne comprimez pas l''abdomen.',
   'Do not leave the patient alone. Do not compress the abdomen.',
   'Croix-Rouge Algérienne / الهلال الأحمر الجزائري',
   'approved', 1, true),

  ('e1000000-0000-0000-0000-000000000002',
   'd1000000-0000-0000-0000-000000000003',
   'كيفية إيقاف النزيف الشديد',
   'Comment arrêter un saignement abondant',
   'How to Stop Severe Bleeding',
   '⚠️ النزيف الشديد حالة طارئة. اتصل بالإسعاف فوراً.',
   '⚠️ Un saignement abondant est une urgence médicale.',
   '⚠️ Severe bleeding is a medical emergency.',
   'اتصل بالطوارئ فوراً في حالة نزيف لا يتوقف بعد 10 دقائق أو نزيف ناتج عن جرح عميق',
   'Appelez les secours si le saignement ne s''arrête pas après 10 minutes',
   'Call emergency services if bleeding does not stop after 10 minutes',
   'لا تزيل أي جسم غريب مغروز في الجرح. لا تضغط مباشرة على الكسور المفتوحة',
   'Ne retirez pas d''objet incrusté dans la plaie.',
   'Do not remove an embedded object from a wound.',
   'الهلال الأحمر الجزائري',
   'approved', 1, true)
ON CONFLICT (id) DO NOTHING;

-- CPR steps
INSERT INTO first_aid_steps (guide_id, step_number, instruction_ar, instruction_fr, instruction_en, is_critical) VALUES
  ('e1000000-0000-0000-0000-000000000001', 1, 'تحقق من سلامة المكان والمريض - اضغط على كتفيه بلطف وناده بصوت عالٍ', 'Vérifiez la sécurité et répondez au patient en le secouant doucement et en l''appelant', 'Check safety and responsiveness - tap shoulders firmly and call out loudly', true),
  ('e1000000-0000-0000-0000-000000000001', 2, 'اطلب من شخص آخر الاتصال بالطوارئ (15 أو 1021) وإحضار جهاز AED إن وجد', 'Demandez à quelqu''un d''appeler le 15 et d''apporter un DAE si disponible', 'Ask someone to call emergency services and get an AED if available', true),
  ('e1000000-0000-0000-0000-000000000001', 3, 'افتح مجرى الهواء: أمل الرأس للخلف برفع الذقن', 'Ouvrez les voies respiratoires: inclinez la tête et soulevez le menton', 'Open airway: tilt head back and lift chin', true),
  ('e1000000-0000-0000-0000-000000000001', 4, 'تحقق من التنفس (لا تتجاوز 10 ثواني): هل ترى حركة الصدر؟ هل تسمع أنفاساً؟', 'Vérifiez la respiration (max 10 secondes): mouvement de la poitrine, sons', 'Check for breathing (no more than 10 seconds): chest movement, sounds', true),
  ('e1000000-0000-0000-0000-000000000001', 5, 'ضع يدك على مركز الصدر، ضع يدك الأخرى فوقها. اضغط بقوة وبسرعة 100-120 ضغطة في الدقيقة بعمق 5-6 سم', 'Placez vos mains au centre de la poitrine. Compressions de 5-6 cm à 100-120/min', 'Place hands on center of chest. Compress 5-6 cm at 100-120 per minute', true),
  ('e1000000-0000-0000-0000-000000000001', 6, 'أعطِ نفسين إنقاذ بعد كل 30 ضغطة إذا كنت مدرباً. إذا لم تكن مدرباً، استمر في الضغطات فقط', 'Donnez 2 insufflations après 30 compressions si vous êtes formé, sinon continuez uniquement les compressions', 'Give 2 rescue breaths after every 30 compressions if trained, otherwise continue compressions only', false),
  ('e1000000-0000-0000-0000-000000000001', 7, 'استمر حتى وصول الإسعاف، أو يبدأ المريض بالتنفس، أو تصبح منهكاً تماماً', 'Continuez jusqu''à l''arrivée des secours, jusqu''à ce que la victime reprenne conscience, ou jusqu''à épuisement total', 'Continue until emergency services arrive, victim recovers, or you are completely exhausted', true);

-- Bleeding steps
INSERT INTO first_aid_steps (guide_id, step_number, instruction_ar, instruction_fr, instruction_en, is_critical) VALUES
  ('e1000000-0000-0000-0000-000000000002', 1, 'ارتدِ قفازات طبية إن أمكن لحماية نفسك', 'Portez des gants médicaux si possible', 'Wear medical gloves if available to protect yourself', false),
  ('e1000000-0000-0000-0000-000000000002', 2, 'اضغط بقوة على الجرح باستخدام قطعة قماش نظيفة أو ضمادة', 'Appuyez fermement sur la plaie avec un chiffon propre ou un pansement', 'Apply firm pressure to the wound using a clean cloth or bandage', true),
  ('e1000000-0000-0000-0000-000000000002', 3, 'إذا كانت الضمادة مشبعة، أضف طبقة أخرى فوقها دون رفع الأولى', 'Si le pansement est saturé, ajoutez une couche sans retirer la première', 'If dressing becomes soaked, add another layer without removing the first', true),
  ('e1000000-0000-0000-0000-000000000002', 4, 'ارفع الجزء المصاب فوق مستوى القلب إن أمكن', 'Élevez la partie blessée au-dessus du niveau du cœur si possible', 'Elevate the injured part above heart level if possible', false),
  ('e1000000-0000-0000-0000-000000000002', 5, 'إذا لم يتوقف النزيف، ضع رباطاً ضاغطاً فوق الجرح واطلب المساعدة الطبية فوراً', 'Si le saignement ne s''arrête pas, appliquez un garrot et demandez une aide médicale immédiate', 'If bleeding does not stop, apply tourniquet and seek immediate medical help', true);
