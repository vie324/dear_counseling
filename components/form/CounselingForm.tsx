"use client";

import { useState, useTransition } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  CounselingResponseSchema,
  type CounselingResponse,
  LABELS,
} from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormError, FormHelp } from "@/components/ui/form-message";
import { ConcernsSelector } from "@/components/form/ConcernsSelector";
import { submitCounseling } from "@/app/form/[token]/actions";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 7;

export function CounselingForm({ token }: { token: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<CounselingResponse>({
    resolver: zodResolver(CounselingResponseSchema),
    defaultValues: {
      // Section 4
      concerns: {
        head_neck: [], lower_back: [], legs: [], face: [],
        eyes: [], women: [], systemic: [],
      },
      postpartum_symptoms: [],
      // Section 7
      lifestyle: {
        usual_posture: [],
        sleep_quality: [],
        eating_habit: [],
      } as any,
      desired_treatment: [],
      consent_treatment: false as any,
      consent_privacy: false as any,
    },
    mode: "onBlur",
  });

  const { handleSubmit, watch, trigger } = methods;
  const gender = watch("gender");
  const visitPurpose = watch("visit_purpose");
  const showSection6 = visitPurpose === "body_shape" || visitPurpose === "health";

  // Section6 をスキップするロジック
  const nextStep = async () => {
    // 現在のステップに該当するフィールドだけバリデーション
    const valid = await validateStep(step, trigger, gender);
    if (!valid) return;

    let next = step + 1;
    if (next === 6 && !showSection6) next = 7;
    if (next > TOTAL_STEPS) next = TOTAL_STEPS;
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    let prev = step - 1;
    if (prev === 6 && !showSection6) prev = 5;
    if (prev < 1) prev = 1;
    setStep(prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = (data: CounselingResponse) => {
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitCounseling(token, data);
      if (result.success) {
        router.push("/thanks");
      } else {
        setSubmitError(result.error || "送信に失敗しました");
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* プログレスバー */}
        <ProgressBar step={step} total={TOTAL_STEPS} skipSec6={!showSection6} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sm:p-8">
          {step === 1 && <Section1 />}
          {step === 2 && <Section2 />}
          {step === 3 && <Section3 />}
          {step === 4 && <Section4 gender={gender} />}
          {step === 5 && <Section5 gender={gender} />}
          {step === 6 && showSection6 && <Section6 />}
          {step === 7 && <Section7 />}
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* ナビゲーション */}
        <div className="flex justify-between gap-3 pb-12">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isPending}
            >
              ← 戻る
            </Button>
          )}
          <div className="flex-1" />
          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={nextStep} disabled={isPending}>
              次へ →
            </Button>
          ) : (
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "送信中..." : "送信する"}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

// ============================================================
// プログレスバー
// ============================================================
function ProgressBar({
  step,
  total,
  skipSec6,
}: {
  step: number;
  total: number;
  skipSec6: boolean;
}) {
  const effective = skipSec6 ? total - 1 : total;
  const current = skipSec6 && step >= 6 ? step - 1 : step;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>
          ステップ {current} / {effective}
        </span>
        <span>{Math.round((current / effective) * 100)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-700 transition-all duration-300"
          style={{ width: `${(current / effective) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Section 1: 基本情報
// ============================================================
function Section1() {
  const { register, formState: { errors } } = useFormContextTyped();
  return (
    <SectionWrapper title="基本情報" step={1}>
      <FieldGroup>
        <Field label="氏名" required error={errors.name?.message}>
          <Input {...register("name")} placeholder="山田 花子" />
        </Field>
        <Field label="フリガナ" required error={errors.name_kana?.message}>
          <Input {...register("name_kana")} placeholder="ヤマダ ハナコ" />
        </Field>
        <Field label="生年月日" required error={errors.birth_date?.message}>
          <Input type="date" {...register("birth_date")} />
        </Field>
        <Field label="性別" required error={errors.gender?.message}>
          <Controller
            name="gender"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-3 gap-2">
                {(["female", "male", "other"] as const).map((v) => (
                  <RadioOption key={v} value={v} label={LABELS.gender[v]} />
                ))}
              </RadioGroup>
            )}
          />
        </Field>
        <Field label="電話番号" required error={errors.phone?.message}>
          <Input type="tel" {...register("phone")} placeholder="09012345678" />
        </Field>
        <Field label="メールアドレス" required error={errors.email?.message}>
          <Input type="email" {...register("email")} placeholder="hanako@example.com" />
          <FormHelp>送信完了メールをお送りします</FormHelp>
        </Field>
        <Field label="郵便番号" error={errors.postal_code?.message}>
          <Input {...register("postal_code")} placeholder="2430018" />
        </Field>
        <Field label="ご住所" error={errors.address?.message}>
          <Input {...register("address")} placeholder="神奈川県厚木市..." />
        </Field>
        <Field label="ご職業" error={errors.occupation?.message}>
          <Input {...register("occupation")} placeholder="例: 会社員" />
        </Field>
        <Field label="身長 (cm)" error={errors.height_cm?.message}>
          <Input
            type="number"
            {...register("height_cm", { valueAsNumber: true })}
            placeholder="160"
          />
        </Field>
      </FieldGroup>
    </SectionWrapper>
  );
}

// ============================================================
// Section 2: 来院きっかけ
// ============================================================
function Section2() {
  const { register, watch, formState: { errors } } = useFormContextTyped();
  const referralSource = watch("referral_source");
  return (
    <SectionWrapper title="来院きっかけ" step={2}>
      <FieldGroup>
        <Field label="当院を知ったきっかけ" required error={errors.referral_source?.message}>
          <Controller
            name="referral_source"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange}>
                {Object.entries(LABELS.referral_source).map(([k, v]) => (
                  <RadioOption key={k} value={k} label={v} />
                ))}
              </RadioGroup>
            )}
          />
        </Field>
        {referralSource === "google" && (
          <Field label="検索キーワード">
            <Input {...register("search_keyword")} placeholder="例: 厚木 骨盤矯正" />
            <FormHelp>どんなキーワードで検索されましたか？</FormHelp>
          </Field>
        )}
        {(referralSource === "referral_customer" || referralSource === "referral_staff") && (
          <Field label="ご紹介者のお名前">
            <Input {...register("referrer_name")} />
          </Field>
        )}
      </FieldGroup>
    </SectionWrapper>
  );
}

// ============================================================
// Section 3: 主訴
// ============================================================
function Section3() {
  const { register, formState: { errors } } = useFormContextTyped();
  return (
    <SectionWrapper title="今回のご相談内容" step={3} subtitle="今回のカウンセリングで最も大切な情報です">
      <FieldGroup>
        <Field label="今回、最も改善したいことを教えてください" required error={errors.chief_complaint?.message}>
          <Textarea
            {...register("chief_complaint")}
            placeholder="例: 産後の骨盤の歪みと下腹のぽっこりが気になります。"
            rows={4}
          />
          <FormHelp>1〜2文で具体的にお願いします</FormHelp>
        </Field>
        <Field label="ご来院の主な目的" required error={errors.visit_purpose?.message}>
          <Controller
            name="visit_purpose"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange}>
                {Object.entries(LABELS.visit_purpose).map(([k, v]) => (
                  <RadioOption key={k} value={k} label={v} />
                ))}
              </RadioGroup>
            )}
          />
        </Field>
      </FieldGroup>
    </SectionWrapper>
  );
}

// ============================================================
// Section 4: お悩み箇所
// ============================================================
function Section4({ gender }: { gender?: string }) {
  const { register, watch, formState: { errors } } = useFormContextTyped();
  const concerns = watch("concerns");
  const hasPain =
    (concerns?.head_neck || []).some((s: string) => s.includes("痛")) ||
    (concerns?.lower_back || []).some((s: string) => s.includes("痛"));

  return (
    <SectionWrapper title="お悩み箇所" step={4} subtitle="気になる部位をタップして、当てはまるお悩みをすべて選んでください">
      <ConcernsSelector gender={gender} />

      <div className="mt-8 pt-6 border-t border-gray-200">
        <FieldGroup>
          <Field label="この中で、一番改善したいお悩みは？" required error={errors.top_concern?.message}>
            <Input
              {...register("top_concern")}
              placeholder="例: 産後の骨盤の歪み"
            />
            <FormHelp>1つだけ入れてください。施術プランの優先順位を決めるのに使います</FormHelp>
          </Field>

          {hasPain && (
            <>
              <Field label="痛みの強さ" error={errors.pain_level?.message}>
                <Controller
                  name="pain_level"
                  render={({ field }) => (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => field.onChange(n)}
                          className={cn(
                            "flex-1 h-12 rounded-md border text-sm font-medium",
                            field.value === n
                              ? "bg-brand-700 text-white border-brand-700"
                              : "bg-white border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                />
                <FormHelp>1（軽い）〜 5（耐えられない）</FormHelp>
              </Field>

              <Field label="症状はいつ頃から？" error={errors.symptom_duration?.message}>
                <Controller
                  name="symptom_duration"
                  render={({ field }) => (
                    <RadioGroup value={field.value || ""} onValueChange={field.onChange}>
                      {Object.entries(LABELS.symptom_duration).map(([k, v]) => (
                        <RadioOption key={k} value={k} label={v} />
                      ))}
                    </RadioGroup>
                  )}
                />
              </Field>
            </>
          )}
        </FieldGroup>
      </div>
    </SectionWrapper>
  );
}

// ============================================================
// Section 5: 健康状態
// ============================================================
function Section5({ gender }: { gender?: string }) {
  const { register, watch, formState: { errors } } = useFormContextTyped();
  const underMedical = watch("under_medical_care");
  const hasSurgery = watch("surgery_history");
  const hasMedication = watch("taking_medication");
  const hasAllergy = watch("has_allergy");
  const pregnancyHistory = watch("pregnancy_history");

  return (
    <SectionWrapper title="健康状態の確認" step={5} subtitle="安全に施術を受けていただくために確認させてください">
      <FieldGroup>
        <BoolField name="under_medical_care" label="現在、医療機関にかかっていますか？" />
        {underMedical && (
          <Field label="医院名・治療部位" indent>
            <Textarea {...register("medical_care_detail")} rows={2} placeholder="例: ◯◯整形外科 / 腰部" />
          </Field>
        )}

        <BoolField name="surgery_history" label="過去に手術を受けたことはありますか？" />
        {hasSurgery && (
          <Field label="手術の内容と時期" indent>
            <Textarea {...register("surgery_detail")} rows={2} placeholder="例: 2020年 帝王切開" />
          </Field>
        )}

        <BoolField name="taking_medication" label="現在、お薬を飲まれていますか？" />
        {hasMedication && (
          <Field label="お薬の名前・目的" indent>
            <Textarea {...register("medication_detail")} rows={2} />
          </Field>
        )}

        <BoolField name="has_allergy" label="アレルギーはありますか？" />
        {hasAllergy && (
          <Field label="アレルギーの内容" indent>
            <Textarea {...register("allergy_detail")} rows={2} placeholder="食物・薬剤・金属・ラテックスなど" />
          </Field>
        )}

        {gender === "female" && (
          <>
            <BoolField
              name="pregnancy_history"
              label="過去に妊娠・出産の経験はありますか？"
            />
            {pregnancyHistory && (
              <Field label="該当する症状（複数選択可）" indent>
                <Controller
                  name="postpartum_symptoms"
                  render={({ field }) => (
                    <div className="space-y-2">
                      {["腹直筋離開", "子宮脱", "尿漏れ", "頻尿", "特になし"].map((opt) => {
                        const checked = (field.value || []).includes(opt);
                        return (
                          <label
                            key={opt}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded border cursor-pointer",
                              checked ? "border-brand-700 bg-brand-50" : "border-gray-200"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => {
                                const next = checked
                                  ? (field.value || []).filter((v: string) => v !== opt)
                                  : [...(field.value || []), opt];
                                field.onChange(next);
                              }}
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </Field>
            )}

            <Field label="現在、妊娠中もしくは妊娠の可能性はありますか？" required error={errors.currently_pregnant?.message}>
              <Controller
                name="currently_pregnant"
                render={({ field }) => (
                  <RadioGroup value={field.value || ""} onValueChange={field.onChange}>
                    {Object.entries(LABELS.pregnancy).map(([k, v]) => (
                      <RadioOption key={k} value={k} label={v} />
                    ))}
                  </RadioGroup>
                )}
              />
            </Field>
          </>
        )}
      </FieldGroup>
    </SectionWrapper>
  );
}

// ============================================================
// Section 6: 体型・ダイエット（条件付き）
// ============================================================
function Section6() {
  const { register, formState: { errors } } = useFormContextTyped();
  return (
    <SectionWrapper title="体型・ダイエット" step={6} subtitle="目標を共有していただくと精度の高いプランニングが可能です">
      <FieldGroup>
        <Field label="現在の体重 (kg)" required error={errors.current_weight_kg?.message}>
          <Input type="number" step="0.1" {...register("current_weight_kg", { valueAsNumber: true })} />
        </Field>
        <Field label="目標体重 (kg)" error={errors.target_weight_kg?.message}>
          <Input type="number" step="0.1" {...register("target_weight_kg", { valueAsNumber: true })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="人生最大体重 (kg)" error={errors.max_weight_kg?.message}>
            <Input type="number" step="0.1" {...register("max_weight_kg", { valueAsNumber: true })} />
          </Field>
          <Field label="その時の年齢" error={errors.max_weight_age?.message}>
            <Input type="number" {...register("max_weight_age", { valueAsNumber: true })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="人生最小体重 (kg)" error={errors.min_weight_kg?.message}>
            <Input type="number" step="0.1" {...register("min_weight_kg", { valueAsNumber: true })} />
          </Field>
          <Field label="その時の年齢" error={errors.min_weight_age?.message}>
            <Input type="number" {...register("min_weight_age", { valueAsNumber: true })} />
          </Field>
        </div>
        <Field label="産後の体型変化はありますか？" error={errors.postpartum_weight_change?.message}>
          <Controller
            name="postpartum_weight_change"
            render={({ field }) => (
              <RadioGroup value={field.value || ""} onValueChange={field.onChange} className="grid grid-cols-3 gap-2">
                {Object.entries(LABELS.postpartum_weight_change).map(([k, v]) => (
                  <RadioOption key={k} value={k} label={v} />
                ))}
              </RadioGroup>
            )}
          />
        </Field>
      </FieldGroup>
    </SectionWrapper>
  );
}

// ============================================================
// Section 7: 生活習慣・希望施術・同意
// ============================================================
function Section7() {
  const { register, formState: { errors } } = useFormContextTyped();
  return (
    <SectionWrapper title="生活習慣・希望施術・同意" step={7}>
      <FieldGroup>
        <Field label="普段よくとる姿勢（複数選択可）" required error={(errors as any).lifestyle?.usual_posture?.message}>
          <MultiCheckboxField name="lifestyle.usual_posture" options={LABELS.posture} />
        </Field>

        <Field label="運動の頻度" required error={(errors as any).lifestyle?.exercise_frequency?.message}>
          <Controller
            name="lifestyle.exercise_frequency"
            render={({ field }) => (
              <RadioGroup value={field.value || ""} onValueChange={field.onChange}>
                {Object.entries(LABELS.exercise_freq).map(([k, v]) => (
                  <RadioOption key={k} value={k} label={v} />
                ))}
              </RadioGroup>
            )}
          />
        </Field>

        <Field label="便通" required error={(errors as any).lifestyle?.bowel_movement?.message}>
          <Controller
            name="lifestyle.bowel_movement"
            render={({ field }) => (
              <RadioGroup value={field.value || ""} onValueChange={field.onChange}>
                {Object.entries(LABELS.bowel).map(([k, v]) => (
                  <RadioOption key={k} value={k} label={v} />
                ))}
              </RadioGroup>
            )}
          />
        </Field>

        <Field label="1日の睡眠時間（時間）" required error={(errors as any).lifestyle?.sleep_hours?.message}>
          <Input
            type="number"
            step="0.5"
            {...register("lifestyle.sleep_hours", { valueAsNumber: true })}
            placeholder="7"
          />
        </Field>

        <Field label="睡眠の質（複数選択可）" required>
          <MultiCheckboxField name="lifestyle.sleep_quality" options={LABELS.sleep_quality} />
        </Field>

        <Field label="食習慣（複数選択可）" required>
          <MultiCheckboxField name="lifestyle.eating_habit" options={LABELS.eating_habit} />
        </Field>

        <Field label="食事内容で気になること">
          <Textarea
            {...register("lifestyle.dietary_concerns")}
            rows={2}
            placeholder="例: 外食が週5回、甘いものが多い、野菜不足、など"
          />
        </Field>

        <Field label="アルコール" required>
          <Controller
            name="lifestyle.alcohol"
            render={({ field }) => (
              <RadioGroup value={field.value || ""} onValueChange={field.onChange} className="grid grid-cols-2 gap-2">
                {Object.entries(LABELS.alcohol).map(([k, v]) => (
                  <RadioOption key={k} value={k} label={v} />
                ))}
              </RadioGroup>
            )}
          />
        </Field>

        <Field label="1日の水分摂取量（L）">
          <Input
            type="number"
            step="0.1"
            {...register("lifestyle.water_intake_l", { valueAsNumber: true })}
            placeholder="1.5"
          />
        </Field>

        <Field label="服用中のサプリメント・健康食品">
          <Textarea {...register("lifestyle.supplements")} rows={2} />
        </Field>

        <Field label="受けたい施術（複数選択可）" required error={errors.desired_treatment?.message}>
          <MultiCheckboxField name="desired_treatment" options={LABELS.desired_treatment} />
        </Field>
      </FieldGroup>

      <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
        <h4 className="font-bold text-gray-900">同意事項</h4>

        <ConsentCheckbox
          name="consent_treatment"
          label="施術・楽トレを受けるにあたり、注意事項・禁忌事項の説明を受け、自己責任のもと施術を受けることに同意します。"
        />

        <ConsentCheckbox
          name="consent_privacy"
          label="個人情報の取扱いに同意します。"
          link={{ href: "/privacy", text: "プライバシーポリシーを読む" }}
        />

        <Field label="ご署名（フルネームを入力してください）" required error={errors.signature?.message}>
          <Input {...register("signature")} placeholder="山田 花子" />
          <FormHelp>フルネームの入力をもって、書面による署名と同等とみなします</FormHelp>
        </Field>
      </div>
    </SectionWrapper>
  );
}

// ============================================================
// 共通 UI ヘルパー
// ============================================================

import { useFormContext } from "react-hook-form";
function useFormContextTyped() {
  return useFormContext<CounselingResponse>();
}

function SectionWrapper({
  title,
  step,
  subtitle,
  children,
}: {
  title: string;
  step: number;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium text-brand-700">SECTION {step}</p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}

function Field({
  label,
  required,
  error,
  indent,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  indent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(indent && "pl-4 border-l-2 border-brand-100")}>
      <Label required={required}>{label}</Label>
      <div className="mt-2">{children}</div>
      <FormError message={error} />
    </div>
  );
}

function RadioOption({ value, label }: { value: string; label: string }) {
  return (
    <label className="flex items-center gap-2 p-2 rounded border border-gray-200 cursor-pointer hover:border-brand-300 has-[input:checked]:border-brand-700 has-[input:checked]:bg-brand-50">
      <RadioGroupItem value={value} />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function BoolField({ name, label }: { name: keyof CounselingResponse | string; label: string }) {
  return (
    <Field label={label} required>
      <Controller
        name={name as any}
        render={({ field }) => (
          <RadioGroup
            value={field.value === true ? "yes" : field.value === false ? "no" : ""}
            onValueChange={(v) => field.onChange(v === "yes")}
            className="grid grid-cols-2 gap-2"
          >
            <RadioOption value="yes" label="はい" />
            <RadioOption value="no" label="いいえ" />
          </RadioGroup>
        )}
      />
    </Field>
  );
}

function MultiCheckboxField({
  name,
  options,
}: {
  name: string;
  options: Record<string, string>;
}) {
  return (
    <Controller
      name={name as any}
      render={({ field }) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(options).map(([k, v]) => {
            const checked = (field.value || []).includes(k);
            return (
              <label
                key={k}
                className={cn(
                  "flex items-center gap-2 p-2 rounded border cursor-pointer text-sm",
                  checked ? "border-brand-700 bg-brand-50" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => {
                    const arr = field.value || [];
                    field.onChange(
                      checked ? arr.filter((x: string) => x !== k) : [...arr, k]
                    );
                  }}
                />
                <span>{v}</span>
              </label>
            );
          })}
        </div>
      )}
    />
  );
}

function ConsentCheckbox({
  name,
  label,
  link,
}: {
  name: string;
  label: string;
  link?: { href: string; text: string };
}) {
  const { formState: { errors } } = useFormContextTyped();
  const error = (errors as any)[name]?.message;
  return (
    <div>
      <Controller
        name={name as any}
        render={({ field }) => (
          <label className="flex items-start gap-3 p-3 rounded border border-gray-200 cursor-pointer has-[input:checked]:border-brand-700 has-[input:checked]:bg-brand-50">
            <Checkbox
              checked={field.value === true}
              onCheckedChange={(v) => field.onChange(v === true)}
              className="mt-0.5"
            />
            <div className="flex-1 text-sm">
              <p>{label}</p>
              {link && (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 underline mt-1 inline-block"
                >
                  {link.text}
                </a>
              )}
            </div>
          </label>
        )}
      />
      <FormError message={error} />
    </div>
  );
}

// ============================================================
// ステップごとのバリデーション
// ============================================================
async function validateStep(
  step: number,
  trigger: any,
  gender?: string
): Promise<boolean> {
  const fieldsByStep: Record<number, string[]> = {
    1: ["name", "name_kana", "birth_date", "gender", "phone", "email"],
    2: ["referral_source"],
    3: ["chief_complaint", "visit_purpose"],
    4: ["top_concern"],
    5: [
      "under_medical_care", "surgery_history",
      "taking_medication", "has_allergy",
      ...(gender === "female" ? ["currently_pregnant"] : []),
    ],
    6: ["current_weight_kg"],
    7: [
      "lifestyle.exercise_frequency",
      "lifestyle.bowel_movement",
      "lifestyle.sleep_hours",
      "lifestyle.alcohol",
      "desired_treatment",
      "consent_treatment",
      "consent_privacy",
      "signature",
    ],
  };
  const fields = fieldsByStep[step] || [];
  return await trigger(fields as any);
}
