/**
 * Supabase の counseling_responses 行の型。
 * supabase/migrations のスキーマと対応。
 */
import type { ConcernCategory } from "./schema";

export interface AiSummary {
  /** 3行程度の要約 */
  summary: string;
  /** おすすめ施術（DesiredTreatmentEnum のラベル等、人間可読の日本語） */
  recommended_treatments: string[];
  /** 禁忌・注意事項 */
  contraindications: string[];
  /** 優先的にアプローチすべき部位・テーマ */
  priority_areas: string[];
  /** 確信度 0〜1 */
  confidence: number;
}

export type ResponseStatus = "submitted" | "reviewed" | "completed" | "archived";

export interface CounselingRow {
  id: string;
  invitation_id: string | null;
  customer_id: string | null;

  // Section 1
  name: string;
  name_kana: string | null;
  birth_date: string | null;
  gender: "female" | "male" | "other" | null;
  phone: string | null;
  email: string | null;
  postal_code: string | null;
  address: string | null;
  occupation: string | null;
  height_cm: number | null;

  // Section 2
  referral_source: string | null;
  search_keyword: string | null;
  referrer_name: string | null;

  // Section 3
  chief_complaint: string;
  visit_purpose: string | null;

  // Section 4
  concerns: Record<ConcernCategory, string[]>;
  top_concern: string | null;
  pain_level: number | null;
  symptom_duration: string | null;

  // Section 5
  under_medical_care: boolean | null;
  medical_care_detail: string | null;
  surgery_history: boolean | null;
  surgery_detail: string | null;
  taking_medication: boolean | null;
  medication_detail: string | null;
  has_allergy: boolean | null;
  allergy_detail: string | null;
  pregnancy_history: boolean | null;
  postpartum_symptoms: string[] | null;
  currently_pregnant: "yes" | "no" | "unsure" | null;

  // Section 6
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  max_weight_kg: number | null;
  max_weight_age: number | null;
  min_weight_kg: number | null;
  min_weight_age: number | null;
  postpartum_weight_change: "yes" | "no" | "na" | null;

  // Section 7
  lifestyle: {
    usual_posture?: string[];
    exercise_frequency?: string;
    bowel_movement?: string;
    sleep_hours?: number;
    sleep_quality?: string[];
    eating_habit?: string[];
    dietary_concerns?: string;
    alcohol?: string;
    water_intake_l?: number | null;
    supplements?: string;
  };
  desired_treatment: string[];

  // 同意
  consent_treatment: boolean;
  consent_privacy: boolean;
  signature: string;

  // LINE
  line_user_id: string | null;
  line_display_name: string | null;

  // メタ
  submitted_at: string;

  // AI
  ai_summary: AiSummary | null;
  ai_summary_generated_at: string | null;

  // リスク
  is_high_risk: boolean;
  high_risk_reasons: string[] | null;

  // ステータス
  status: ResponseStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
}
