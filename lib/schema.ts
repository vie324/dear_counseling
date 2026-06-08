/**
 * Dear 美容整体 問診票 スキーマ定義
 *
 * 全58問のZodスキーマと TypeScript 型を定義。
 * フォーム入力 → API → Supabase の流れで一貫した型を使う。
 */

import { z } from "zod";

/**
 * 任意の数値入力ヘルパー。
 * react-hook-form の valueAsNumber は空欄を NaN にするため、
 * 空文字 / null / undefined / NaN はすべて null に正規化してから検証する。
 * （これをしないと未入力の数値項目で送信時バリデーションが落ち、
 *   隠れたステップ上のエラーで送信が無反応になる）
 */
const nullableNumber = (build: (n: z.ZodNumber) => z.ZodNumber = (n) => n) =>
  z.preprocess(
    (v) =>
      v === "" ||
      v === null ||
      v === undefined ||
      (typeof v === "number" && Number.isNaN(v))
        ? null
        : v,
    build(z.number()).nullable()
  );

// ============================================
// Enum 定義
// ============================================
export const GenderEnum = z.enum(["female", "male", "other"]);
export type Gender = z.infer<typeof GenderEnum>;

export const ReferralSourceEnum = z.enum([
  "hotpepper",
  "google",
  "instagram",
  "threads",
  "facebook",
  "flyer",
  "referral_customer",
  "referral_staff",
  "other",
]);
export type ReferralSource = z.infer<typeof ReferralSourceEnum>;

export const VisitPurposeEnum = z.enum([
  "body_shape",     // 体型・スタイルの変化
  "pain_relief",    // 痛みからの解放
  "beauty",         // 美容
  "health",         // 健康・体質改善
  "performance",    // 運動パフォーマンス向上
]);
export type VisitPurpose = z.infer<typeof VisitPurposeEnum>;

export const SymptomDurationEnum = z.enum([
  "within_week",
  "within_month",
  "within_3months",
  "within_6months",
  "over_year",
]);

export const PregnancyEnum = z.enum(["yes", "no", "unsure"]);
export const PostpartumWeightChangeEnum = z.enum(["yes", "no", "na"]);

export const PostureEnum = z.enum(["sitting", "standing", "crouching", "cross_legs"]);
export const ExerciseFreqEnum = z.enum(["daily", "2_3_weekly", "weekly", "sometimes", "never"]);
export const BowelEnum = z.enum(["daily", "sometimes_constipated", "often_constipated", "loose"]);
export const SleepQualityEnum = z.enum([
  "well", "normal", "cant_sleep", "wake_often", "hard_to_fall", "bad_wake",
]);
export const EatingHabitEnum = z.enum([
  "hearty", "normal", "snacking", "poor_appetite",
  "skip_breakfast", "skip_lunch", "skip_dinner",
]);
export const AlcoholEnum = z.enum(["daily", "often", "sometimes", "never"]);
export const DesiredTreatmentEnum = z.enum([
  "pelvis", "posture", "exercise", "diet", "ems", "lymph", "recommend",
]);

// ============================================
// Section 1: 基本情報
// ============================================
export const Section1Schema = z.object({
  name: z.string().min(1, "お名前を入力してください").max(50),
  name_kana: z.string().min(1, "フリガナを入力してください").max(50)
    .regex(/^[ァ-ヶー\s]+$/, "カタカナで入力してください"),
  birth_date: z.string().min(1, "生年月日を入力してください")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD形式で入力してください"),
  gender: GenderEnum,
  phone: z.string().min(10).max(15).regex(/^[\d\-+]+$/, "電話番号の形式が正しくありません"),
  email: z.string().email("メールアドレスの形式が正しくありません"),
  postal_code: z.string().regex(/^\d{3}-?\d{4}$/).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  occupation: z.string().max(100).optional().or(z.literal("")),
  height_cm: nullableNumber((n) => n.min(100).max(220)),
});

// ============================================
// Section 2: 来院きっかけ
// ============================================
export const Section2Schema = z.object({
  referral_source: ReferralSourceEnum,
  search_keyword: z.string().max(100).optional().or(z.literal("")),
  referrer_name: z.string().max(50).optional().or(z.literal("")),
});

// ============================================
// Section 3: 主訴
// ============================================
export const Section3Schema = z.object({
  chief_complaint: z.string().min(5, "もう少し詳しく教えてください").max(500),
  visit_purpose: VisitPurposeEnum,
});

// ============================================
// Section 4: お悩み箇所
// ============================================
// 各カテゴリの選択肢を定義
export const CONCERN_OPTIONS = {
  head_neck: [
    "頭が痛い・重い", "首が凝る・痛い", "肩が凝る・痛い", "肩甲骨・背中の凝り",
    "四十肩・五十肩", "二の腕のたるみ", "左右の高さが違う", "しびれ",
    "前腕の太さ", "手の冷え",
  ],
  lower_back: [
    "腰が痛い・張る", "坐骨神経痛", "骨盤の歪み", "下半身太り",
    "お尻のたるみ・大きさ", "腰のお肉", "ヘルニア", "側弯症", "すべり症",
    "股関節に違和感・痛み",
  ],
  legs: [
    "太ももの太さ", "ふくらはぎの太さ", "脚のむくみ", "脚の冷え",
    "O脚・X脚", "外反母趾・内反小趾", "扁平足", "脚がつる",
  ],
  face: [
    "顔の歪み・左右差", "目の大きさ・高さ", "エラの張り", "頬骨のでっぱり",
    "たるみ", "二重あご", "ほうれい線", "シワ", "くすみ", "顎関節症",
    "クマ", "乾燥", "むくみ", "疲れ顔",
  ],
  eyes: ["目が疲れる", "目が乾く", "めまいがする", "立ちくらみ"],
  women: [
    "産後骨盤", "生理痛", "生理不順", "無月経", "不妊症",
    "更年期障害", "不正出血", "PMS", "尿漏れ・頻尿",
  ],
  systemic: [
    "疲れやすい", "体がだるい", "疲れが取れない", "自律神経の乱れ", "イライラしやすい",
    "落ち込みやすい", "やる気が出ない", "風邪をひきやすい", "天気に体調が左右される",
    "貧血気味", "血圧が高い", "血圧が低い", "体温が低い", "筋肉が少ない・弱い",
    "血糖値が高い", "中性脂肪が高い", "骨密度が低い", "便秘", "アレルギー",
    "アトピー性皮膚炎", "花粉症", "ぜんそく", "胃腸が弱い",
  ],
} as const;

export type ConcernCategory = keyof typeof CONCERN_OPTIONS;

export const ConcernsSchema = z.object({
  head_neck: z.array(z.string()).default([]),
  lower_back: z.array(z.string()).default([]),
  legs: z.array(z.string()).default([]),
  face: z.array(z.string()).default([]),
  eyes: z.array(z.string()).default([]),
  women: z.array(z.string()).default([]),
  systemic: z.array(z.string()).default([]),
});

export const Section4Schema = z.object({
  concerns: ConcernsSchema,
  top_concern: z.string().min(1, "一番気になるお悩みを入力してください").max(200),
  pain_level: nullableNumber((n) => n.int().min(1).max(5)),
  symptom_duration: SymptomDurationEnum.optional().nullable(),
});

// ============================================
// Section 5: 健康状態（禁忌確認）
// ============================================
export const Section5Schema = z.object({
  under_medical_care: z.boolean(),
  medical_care_detail: z.string().max(300).optional().or(z.literal("")),
  surgery_history: z.boolean(),
  surgery_detail: z.string().max(300).optional().or(z.literal("")),
  taking_medication: z.boolean(),
  medication_detail: z.string().max(300).optional().or(z.literal("")),
  has_allergy: z.boolean(),
  allergy_detail: z.string().max(300).optional().or(z.literal("")),
  pregnancy_history: z.boolean().optional().nullable(),
  postpartum_symptoms: z.array(z.string()).default([]),
  currently_pregnant: PregnancyEnum.optional().nullable(),
});

// ============================================
// Section 6: 体型・ダイエット（条件付き）
// ============================================
export const Section6Schema = z.object({
  current_weight_kg: nullableNumber((n) => n.min(20).max(300)),
  target_weight_kg: nullableNumber((n) => n.min(20).max(300)),
  max_weight_kg: nullableNumber((n) => n.min(20).max(300)),
  max_weight_age: nullableNumber((n) => n.int().min(0).max(120)),
  min_weight_kg: nullableNumber((n) => n.min(20).max(300)),
  min_weight_age: nullableNumber((n) => n.int().min(0).max(120)),
  postpartum_weight_change: PostpartumWeightChangeEnum.optional().nullable(),
});

// ============================================
// Section 7: 生活習慣・希望施術・同意
// ============================================
export const Section7Schema = z.object({
  // ライフスタイル（JSONBに格納するため lifestyle にネスト）
  lifestyle: z.object({
    usual_posture: z.array(PostureEnum).default([]),
    exercise_frequency: ExerciseFreqEnum,
    bowel_movement: BowelEnum,
    sleep_hours: z.preprocess(
      (v) => (v === "" || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
      z.number({ required_error: "睡眠時間を入力してください" }).min(0).max(24)
    ),
    sleep_quality: z.array(SleepQualityEnum).default([]),
    eating_habit: z.array(EatingHabitEnum).default([]),
    dietary_concerns: z.string().max(500).optional().or(z.literal("")),
    alcohol: AlcoholEnum,
    water_intake_l: nullableNumber((n) => n.min(0).max(20)),
    supplements: z.string().max(500).optional().or(z.literal("")),
  }),
  desired_treatment: z.array(DesiredTreatmentEnum)
    .min(1, "1つ以上選択してください"),

  // 同意
  consent_treatment: z.literal(true, {
    errorMap: () => ({ message: "施術への同意が必要です" }),
  }),
  consent_privacy: z.literal(true, {
    errorMap: () => ({ message: "個人情報の取扱いへの同意が必要です" }),
  }),
  signature: z.string().min(1, "ご署名を入力してください").max(50),
});

// ============================================
// 全体スキーマ（送信時のバリデーション用）
// ============================================
export const CounselingResponseSchema = Section1Schema
  .merge(Section2Schema)
  .merge(Section3Schema)
  .merge(Section4Schema)
  .merge(Section5Schema)
  .merge(Section6Schema)
  .merge(Section7Schema);

export type CounselingResponse = z.infer<typeof CounselingResponseSchema>;

// ============================================
// 表示ラベル定義（UIで使う）
// ============================================
export const LABELS = {
  gender: {
    female: "女性",
    male: "男性",
    other: "回答しない",
  },
  referral_source: {
    hotpepper: "ホットペッパー",
    google: "Google マップ・検索",
    instagram: "Instagram",
    threads: "Threads",
    facebook: "Facebook",
    flyer: "折込チラシ・タウン誌",
    referral_customer: "知人・お客様の紹介",
    referral_staff: "当院スタッフの紹介",
    other: "その他",
  },
  visit_purpose: {
    body_shape: "体型・スタイルの変化",
    pain_relief: "痛みからの解放",
    beauty: "美容（小顔・たるみ・むくみなど）",
    health: "健康・体質改善",
    performance: "運動パフォーマンスの向上",
  },
  symptom_duration: {
    within_week: "1週間以内",
    within_month: "1ヶ月以内",
    within_3months: "3ヶ月以内",
    within_6months: "半年以内",
    over_year: "1年以上",
  },
  pregnancy: {
    yes: "はい",
    no: "いいえ",
    unsure: "わからない",
  },
  postpartum_weight_change: {
    yes: "あり",
    no: "なし",
    na: "該当しない",
  },
  posture: {
    sitting: "座っていることが多い",
    standing: "立っていることが多い",
    crouching: "中腰になることが多い",
    cross_legs: "脚を組むクセがある",
  },
  exercise_freq: {
    daily: "毎日",
    "2_3_weekly": "週2〜3回",
    weekly: "週1回",
    sometimes: "ときどき",
    never: "全くしない",
  },
  bowel: {
    daily: "毎日出る",
    sometimes_constipated: "ときどき便秘になる",
    often_constipated: "便秘しやすい",
    loose: "お腹がゆるい・弱い",
  },
  sleep_quality: {
    well: "よく眠れる",
    normal: "ふつう",
    cant_sleep: "眠れない",
    wake_often: "よく目が覚める",
    hard_to_fall: "寝つきが悪い",
    bad_wake: "目覚めが悪い",
  },
  eating_habit: {
    hearty: "食欲旺盛",
    normal: "ふつう",
    snacking: "間食をする",
    poor_appetite: "食欲がない・あまり食べない",
    skip_breakfast: "朝食を抜く",
    skip_lunch: "昼食を抜く",
    skip_dinner: "夕食を抜く",
  },
  alcohol: {
    daily: "毎日",
    often: "よく飲む",
    sometimes: "たまに",
    never: "飲まない",
  },
  desired_treatment: {
    pelvis: "骨盤矯正",
    posture: "猫背矯正",
    exercise: "運動療法",
    diet: "食事指導",
    ems: "インナーマッスル(EMS)",
    lymph: "リンパケア",
    recommend: "おまかせ",
  },
  concern_category: {
    head_neck: "頭・首・肩・背中",
    lower_back: "腰・骨盤・お尻",
    legs: "脚・足",
    face: "顔・小顔",
    eyes: "眼精・めまい",
    women: "女性のお悩み",
    systemic: "全身症状・体質",
  },
} as const;
