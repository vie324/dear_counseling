/**
 * フォーム入力（CounselingResponse）→ Supabase の counseling_responses 行に変換。
 */
import type { CounselingResponse } from "./schema";

function strOrNull(v: string | undefined | null): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function numOrNull(v: number | undefined | null): number | null {
  if (v == null || Number.isNaN(v)) return null;
  return v;
}

export interface ResponseMeta {
  invitationId?: string | null;
  customerId?: string | null;
  lineUserId?: string | null;
  lineDisplayName?: string | null;
}

export function toDbRow(data: CounselingResponse, meta: ResponseMeta = {}) {
  return {
    invitation_id: meta.invitationId ?? null,
    customer_id: meta.customerId ?? null,
    line_user_id: meta.lineUserId ?? null,
    line_display_name: meta.lineDisplayName ?? null,

    // Section 1
    name: data.name,
    name_kana: strOrNull(data.name_kana),
    birth_date: strOrNull(data.birth_date),
    gender: data.gender,
    phone: strOrNull(data.phone),
    email: strOrNull(data.email),
    postal_code: strOrNull(data.postal_code),
    address: strOrNull(data.address),
    occupation: strOrNull(data.occupation),
    height_cm: numOrNull(data.height_cm),

    // Section 2
    referral_source: data.referral_source,
    search_keyword: strOrNull(data.search_keyword),
    referrer_name: strOrNull(data.referrer_name),

    // Section 3
    chief_complaint: data.chief_complaint,
    visit_purpose: data.visit_purpose,

    // Section 4
    concerns: data.concerns ?? {},
    top_concern: strOrNull(data.top_concern),
    pain_level: numOrNull(data.pain_level),
    symptom_duration: data.symptom_duration ?? null,

    // Section 5
    under_medical_care: data.under_medical_care ?? null,
    medical_care_detail: strOrNull(data.medical_care_detail),
    surgery_history: data.surgery_history ?? null,
    surgery_detail: strOrNull(data.surgery_detail),
    taking_medication: data.taking_medication ?? null,
    medication_detail: strOrNull(data.medication_detail),
    has_allergy: data.has_allergy ?? null,
    allergy_detail: strOrNull(data.allergy_detail),
    pregnancy_history: data.pregnancy_history ?? null,
    postpartum_symptoms: data.postpartum_symptoms ?? [],
    currently_pregnant: data.currently_pregnant ?? null,

    // Section 6
    current_weight_kg: numOrNull(data.current_weight_kg),
    target_weight_kg: numOrNull(data.target_weight_kg),
    max_weight_kg: numOrNull(data.max_weight_kg),
    max_weight_age: numOrNull(data.max_weight_age),
    min_weight_kg: numOrNull(data.min_weight_kg),
    min_weight_age: numOrNull(data.min_weight_age),
    postpartum_weight_change: data.postpartum_weight_change ?? null,

    // Section 7
    lifestyle: data.lifestyle ?? {},
    desired_treatment: data.desired_treatment ?? [],

    // 同意
    consent_treatment: data.consent_treatment,
    consent_privacy: data.consent_privacy,
    signature: data.signature,
  };
}
