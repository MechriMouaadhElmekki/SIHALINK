import type { EmergencyType } from '@/types/database';

export interface TriageQuestion {
  key: string;
  question_ar: string;
  question_fr: string;
  question_en: string;
  type: 'yes_no' | 'number' | 'select' | 'text';
  options?: { value: string; label_ar: string; label_fr: string; label_en: string; }[];
  is_critical: boolean;
}

const COMMON_QUESTIONS: TriageQuestion[] = [
  {
    key: 'is_conscious',
    question_ar: 'هل الشخص واعٍ ومستجيب؟',
    question_fr: 'La personne est-elle consciente et réactive?',
    question_en: 'Is the person conscious and responsive?',
    type: 'yes_no',
    is_critical: true,
  },
  {
    key: 'is_breathing_normally',
    question_ar: 'هل الشخص يتنفس بشكل طبيعي؟',
    question_fr: 'La personne respire-t-elle normalement?',
    question_en: 'Is the person breathing normally?',
    type: 'yes_no',
    is_critical: true,
  },
  {
    key: 'affected_count',
    question_ar: 'كم عدد الأشخاص المصابين؟',
    question_fr: 'Combien de personnes sont touchées?',
    question_en: 'How many people are affected?',
    type: 'select',
    options: [
      { value: '1', label_ar: '1 شخص', label_fr: '1 personne', label_en: '1 person' },
      { value: '2-5', label_ar: '2-5 أشخاص', label_fr: '2-5 personnes', label_en: '2-5 people' },
      { value: 'multiple', label_ar: 'أكثر من 5', label_fr: 'Plus de 5', label_en: 'More than 5' },
    ],
    is_critical: false,
  },
  {
    key: 'immediate_danger',
    question_ar: 'هل هناك خطر فوري في المنطقة؟',
    question_fr: 'Y a-t-il un danger immédiat dans la zone?',
    question_en: 'Is there immediate danger in the area?',
    type: 'yes_no',
    is_critical: true,
  },
];

const TYPE_SPECIFIC_QUESTIONS: Partial<Record<EmergencyType, TriageQuestion[]>> = {
  MEDICAL: [
    {
      key: 'severe_pain',
      question_ar: 'هل يعاني الشخص من ألم شديد؟',
      question_fr: 'La personne souffre-t-elle de douleurs intenses?',
      question_en: 'Is the person experiencing severe pain?',
      type: 'yes_no',
      is_critical: false,
    },
  ],
  SEVERE_BLEEDING: [
    {
      key: 'severe_bleeding',
      question_ar: 'هل النزيف شديد ومستمر؟',
      question_fr: 'Le saignement est-il grave et continu?',
      question_en: 'Is the bleeding severe and continuous?',
      type: 'yes_no',
      is_critical: true,
    },
    {
      key: 'wound_location',
      question_ar: 'أين موقع الجرح؟',
      question_fr: 'Où est la plaie?',
      question_en: 'Where is the wound located?',
      type: 'select',
      options: [
        { value: 'head', label_ar: 'الرأس/الوجه', label_fr: 'Tête/visage', label_en: 'Head/face' },
        { value: 'torso', label_ar: 'الجذع', label_fr: 'Torse', label_en: 'Torso' },
        { value: 'limb', label_ar: 'أحد الأطراف', label_fr: 'Membre', label_en: 'Limb' },
      ],
      is_critical: false,
    },
  ],
  ACCIDENT: [
    {
      key: 'is_trapped',
      question_ar: 'هل الشخص محاصر؟',
      question_fr: 'La personne est-elle coincée/piégée?',
      question_en: 'Is the person trapped?',
      type: 'yes_no',
      is_critical: true,
    },
    {
      key: 'vehicle_involved',
      question_ar: 'هل يتعلق الأمر بمركبة؟',
      question_fr: 'S\'agit-il d\'un accident de véhicule?',
      question_en: 'Does it involve a vehicle?',
      type: 'yes_no',
      is_critical: false,
    },
  ],
  FIRE: [
    {
      key: 'people_inside',
      question_ar: 'هل يوجد أشخاص داخل المبنى؟',
      question_fr: 'Y a-t-il des personnes à l\'intérieur?',
      question_en: 'Are there people inside the building?',
      type: 'yes_no',
      is_critical: true,
    },
  ],
  MATERNITY: [
    {
      key: 'contractions_frequency',
      question_ar: 'ما مدة الفترة بين الانقباضات؟',
      question_fr: 'Quelle est la fréquence des contractions?',
      question_en: 'How frequent are contractions?',
      type: 'select',
      options: [
        { value: 'less_5min', label_ar: 'أقل من 5 دقائق', label_fr: 'Moins de 5 min', label_en: 'Less than 5 min' },
        { value: '5_10min', label_ar: '5-10 دقائق', label_fr: '5-10 min', label_en: '5-10 min' },
        { value: 'more_10min', label_ar: 'أكثر من 10 دقائق', label_fr: 'Plus de 10 min', label_en: 'More than 10 min' },
      ],
      is_critical: true,
    },
  ],
  CHILD_EMERGENCY: [
    {
      key: 'child_age',
      question_ar: 'ما عمر الطفل؟',
      question_fr: 'Quel est l\'âge de l\'enfant?',
      question_en: 'What is the child\'s age?',
      type: 'select',
      options: [
        { value: 'infant', label_ar: 'رضيع (أقل من سنة)', label_fr: 'Nourrisson (<1 an)', label_en: 'Infant (<1 year)' },
        { value: 'toddler', label_ar: '1-5 سنوات', label_fr: '1-5 ans', label_en: '1-5 years' },
        { value: 'child', label_ar: '6-12 سنة', label_fr: '6-12 ans', label_en: '6-12 years' },
        { value: 'teen', label_ar: '13-17 سنة', label_fr: '13-17 ans', label_en: '13-17 years' },
      ],
      is_critical: false,
    },
  ],
};

export function getTriageQuestions(type: EmergencyType): TriageQuestion[] {
  const specific = TYPE_SPECIFIC_QUESTIONS[type] ?? [];
  return [...COMMON_QUESTIONS, ...specific];
}
