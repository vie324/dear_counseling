/**
 * 表示用フォーマット & enum→ラベル変換ヘルパー（スタッフ管理画面で使用）。
 */
import { LABELS } from "./schema";
import type { CounselingRow } from "./db-types";

/** 生年月日から満年齢を計算 */
export function calcAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/** BMI を計算（身長cm・体重kg） */
export function calcBmi(
  heightCm: number | null | undefined,
  weightKg: number | null | undefined
): number | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** ISO日時 → 日本語の読みやすい表記 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** ラベル安全引き：マップに無ければ生値を返す */
function lbl(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return "—";
  return map[key] ?? key;
}

export const display = {
  gender: (v: string | null) => lbl(LABELS.gender, v),
  referralSource: (v: string | null) => lbl(LABELS.referral_source, v),
  visitPurpose: (v: string | null) => lbl(LABELS.visit_purpose, v),
  symptomDuration: (v: string | null) => lbl(LABELS.symptom_duration, v),
  pregnancy: (v: string | null) => lbl(LABELS.pregnancy, v),
  postpartumWeightChange: (v: string | null) =>
    lbl(LABELS.postpartum_weight_change, v),
  posture: (v: string) => lbl(LABELS.posture, v),
  exerciseFreq: (v: string | null) => lbl(LABELS.exercise_freq, v),
  bowel: (v: string | null) => lbl(LABELS.bowel, v),
  sleepQuality: (v: string) => lbl(LABELS.sleep_quality, v),
  eatingHabit: (v: string) => lbl(LABELS.eating_habit, v),
  alcohol: (v: string | null) => lbl(LABELS.alcohol, v),
  desiredTreatment: (v: string) => lbl(LABELS.desired_treatment, v),
  concernCategory: (v: string) => lbl(LABELS.concern_category, v),
};

/** 全お悩みをフラットなリストに（カテゴリ名付き） */
export function flattenConcerns(
  concerns: CounselingRow["concerns"]
): { category: string; items: string[] }[] {
  if (!concerns) return [];
  return (Object.keys(concerns) as (keyof typeof concerns)[])
    .map((cat) => ({
      category: display.concernCategory(cat as string),
      items: concerns[cat] || [],
    }))
    .filter((g) => g.items.length > 0);
}

/** 問診回答を AI へ渡す/表示する読みやすい日本語テキストに整形 */
export function formatResponseAsText(r: CounselingRow): string {
  const age = calcAge(r.birth_date);
  const lines: string[] = [];

  lines.push(`# 基本情報`);
  lines.push(
    `氏名: ${r.name}（${r.name_kana ?? ""}） / 性別: ${display.gender(
      r.gender
    )} / 年齢: ${age ?? "不明"}歳 / 身長: ${r.height_cm ?? "不明"}cm / 職業: ${
      r.occupation || "不明"
    }`
  );

  lines.push(`\n# 主訴・来院目的`);
  lines.push(`主訴: ${r.chief_complaint}`);
  lines.push(`来院目的: ${display.visitPurpose(r.visit_purpose)}`);
  if (r.top_concern) lines.push(`一番改善したいこと: ${r.top_concern}`);
  if (r.pain_level) lines.push(`痛みレベル: ${r.pain_level}/5`);
  if (r.symptom_duration)
    lines.push(`症状の期間: ${display.symptomDuration(r.symptom_duration)}`);

  const concerns = flattenConcerns(r.concerns);
  if (concerns.length > 0) {
    lines.push(`\n# お悩み箇所`);
    for (const g of concerns) lines.push(`- ${g.category}: ${g.items.join("、")}`);
  }

  lines.push(`\n# 健康状態（禁忌確認）`);
  lines.push(
    `医療機関通院中: ${yn(r.under_medical_care)}${
      r.medical_care_detail ? `（${r.medical_care_detail}）` : ""
    }`
  );
  lines.push(
    `手術歴: ${yn(r.surgery_history)}${
      r.surgery_detail ? `（${r.surgery_detail}）` : ""
    }`
  );
  lines.push(
    `服薬: ${yn(r.taking_medication)}${
      r.medication_detail ? `（${r.medication_detail}）` : ""
    }`
  );
  lines.push(
    `アレルギー: ${yn(r.has_allergy)}${
      r.allergy_detail ? `（${r.allergy_detail}）` : ""
    }`
  );
  if (r.gender === "female") {
    lines.push(`妊娠・出産経験: ${yn(r.pregnancy_history)}`);
    if (r.postpartum_symptoms?.length)
      lines.push(`産後症状: ${r.postpartum_symptoms.join("、")}`);
    lines.push(`現在妊娠中/可能性: ${display.pregnancy(r.currently_pregnant)}`);
  }

  if (r.current_weight_kg || r.target_weight_kg) {
    lines.push(`\n# 体型・ダイエット`);
    const bmi = calcBmi(r.height_cm, r.current_weight_kg);
    lines.push(
      `現在体重: ${r.current_weight_kg ?? "—"}kg${bmi ? `（BMI ${bmi}）` : ""} / 目標体重: ${
        r.target_weight_kg ?? "—"
      }kg`
    );
    lines.push(
      `産後の体型変化: ${display.postpartumWeightChange(
        r.postpartum_weight_change
      )}`
    );
  }

  const ls = r.lifestyle || {};
  lines.push(`\n# 生活習慣`);
  if (ls.usual_posture?.length)
    lines.push(`姿勢: ${ls.usual_posture.map(display.posture).join("、")}`);
  lines.push(`運動頻度: ${display.exerciseFreq(ls.exercise_frequency ?? null)}`);
  lines.push(`便通: ${display.bowel(ls.bowel_movement ?? null)}`);
  if (ls.sleep_hours != null) lines.push(`睡眠時間: ${ls.sleep_hours}時間`);
  if (ls.sleep_quality?.length)
    lines.push(`睡眠の質: ${ls.sleep_quality.map(display.sleepQuality).join("、")}`);
  if (ls.eating_habit?.length)
    lines.push(`食習慣: ${ls.eating_habit.map(display.eatingHabit).join("、")}`);
  if (ls.dietary_concerns) lines.push(`食事の気になる点: ${ls.dietary_concerns}`);
  lines.push(`飲酒: ${display.alcohol(ls.alcohol ?? null)}`);
  if (ls.water_intake_l != null) lines.push(`水分摂取: ${ls.water_intake_l}L`);
  if (ls.supplements) lines.push(`サプリ: ${ls.supplements}`);

  if (r.desired_treatment?.length) {
    lines.push(`\n# 希望施術`);
    lines.push(r.desired_treatment.map(display.desiredTreatment).join("、"));
  }

  return lines.join("\n");
}

function yn(v: boolean | null | undefined): string {
  if (v === true) return "はい";
  if (v === false) return "いいえ";
  return "—";
}
