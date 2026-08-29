import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EmergencyType } from '@/types/database';

export interface TriageAnswer {
  question_key: string;
  question_text_ar: string;
  answer: string;
  answer_display_ar: string;
  weight: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  wilaya?: string;
  commune?: string;
  is_manual: boolean;
}

export interface EmergencyDraft {
  // Step 1
  emergency_type: EmergencyType | null;
  description: string;
  affected_count: number;
  // Step 2 – triage
  triage_answers: TriageAnswer[];
  computed_priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  // Step 3 – location
  location: LocationData | null;
  // Step 4 – media (URLs after upload, or skipped)
  media_urls: string[];
  // Step 5 – additional_info
  additional_info: string;
  // Internal
  draft_id: string | null;
  current_step: number;
}

const INITIAL_DRAFT: EmergencyDraft = {
  emergency_type: null,
  description: '',
  affected_count: 1,
  triage_answers: [],
  computed_priority: 'MEDIUM',
  location: null,
  media_urls: [],
  additional_info: '',
  draft_id: null,
  current_step: 1,
};

interface EmergencyStore {
  draft: EmergencyDraft;
  setStep: (step: number) => void;
  setType: (type: EmergencyType, description?: string, affected_count?: number) => void;
  setTriage: (answers: TriageAnswer[], priority: EmergencyDraft['computed_priority']) => void;
  setLocation: (location: LocationData) => void;
  setAdditionalInfo: (info: string) => void;
  setDraftId: (id: string) => void;
  reset: () => void;
}

export const useEmergencyStore = create<EmergencyStore>()(
  persist(
    (set) => ({
      draft: INITIAL_DRAFT,
      setStep: (step) => set((s) => ({ draft: { ...s.draft, current_step: step } })),
      setType: (type, description = '', affected_count = 1) =>
        set((s) => ({ draft: { ...s.draft, emergency_type: type, description, affected_count } })),
      setTriage: (answers, priority) =>
        set((s) => ({ draft: { ...s.draft, triage_answers: answers, computed_priority: priority } })),
      setLocation: (location) =>
        set((s) => ({ draft: { ...s.draft, location } })),
      setAdditionalInfo: (info) =>
        set((s) => ({ draft: { ...s.draft, additional_info: info } })),
      setDraftId: (id) =>
        set((s) => ({ draft: { ...s.draft, draft_id: id } })),
      reset: () => set({ draft: INITIAL_DRAFT }),
    }),
    {
      name: 'sihalink-emergency-draft',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
