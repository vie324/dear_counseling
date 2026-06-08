import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { CounselingRow } from "@/lib/db-types";
import {
  calcAge,
  calcBmi,
  display,
  formatDate,
  formatDateTime,
} from "@/lib/format";
import { SummaryCard } from "@/components/admin/SummaryCard";
import { BodyMapReadonly } from "@/components/admin/BodyMapReadonly";
import { StatusControl } from "@/components/admin/StatusControl";

export const dynamic = "force-dynamic";

export default async function ResponseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("counseling_responses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <p className="text-sm text-red-600">
        データの取得に失敗しました。権限（RLS / スタッフ登録）をご確認ください。
      </p>
    );
  }
  if (!data) notFound();

  const r = data as CounselingRow;
  const age = calcAge(r.birth_date);
  const bmi = calcBmi(r.height_cm, r.current_weight_kg);
  const aiConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="space-y-5">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-700"
      >
        <ArrowLeft size={15} /> 一覧へ戻る
      </Link>

      {/* ヘッダー */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{r.name}</h1>
              {r.name_kana && (
                <span className="text-sm text-gray-400">{r.name_kana}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {display.gender(r.gender)}
              {age != null && ` ・ ${age}歳`}
              {r.birth_date && `（${formatDate(r.birth_date)}）`}
              {r.occupation && ` ・ ${r.occupation}`}
            </p>
          </div>
          <StatusControl id={r.id} current={r.status} />
        </div>

        {/* 連絡先・メタ */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-gray-600">
          {r.phone && (
            <a
              href={`tel:${r.phone}`}
              className="flex items-center gap-1 hover:text-brand-700"
            >
              <Phone size={14} /> {r.phone}
            </a>
          )}
          {r.email && (
            <a
              href={`mailto:${r.email}`}
              className="flex items-center gap-1 hover:text-brand-700"
            >
              <Mail size={14} /> {r.email}
            </a>
          )}
          {r.line_user_id && (
            <span className="flex items-center gap-1 text-green-600">
              <MessageCircle size={14} /> LINE連携
              {r.line_display_name ? `（${r.line_display_name}）` : ""}
            </span>
          )}
          <span className="text-gray-400">
            送信: {formatDateTime(r.submitted_at)}
          </span>
          <span className="text-gray-400">
            きっかけ: {display.referralSource(r.referral_source)}
          </span>
        </div>
      </div>

      {/* 禁忌アラート */}
      {r.is_high_risk && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700 font-bold">
            <AlertTriangle size={18} /> 要確認（禁忌の可能性）
          </div>
          {r.high_risk_reasons?.length ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {r.high_risk_reasons.map((reason) => (
                <li
                  key={reason}
                  className="px-2.5 py-1 rounded-full text-sm bg-white border border-red-200 text-red-700"
                >
                  {reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {/* AI サマリー */}
      <SummaryCard
        responseId={r.id}
        initialSummary={r.ai_summary}
        generatedAt={r.ai_summary_generated_at}
        aiConfigured={aiConfigured}
      />

      {/* 主訴 */}
      <Card title="今回のご相談内容">
        <p className="text-lg font-medium text-gray-900 leading-relaxed">
          {r.chief_complaint}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Field label="来院目的">{display.visitPurpose(r.visit_purpose)}</Field>
          {r.top_concern && (
            <Field label="一番改善したいこと">{r.top_concern}</Field>
          )}
          {r.symptom_duration && (
            <Field label="症状の期間">
              {display.symptomDuration(r.symptom_duration)}
            </Field>
          )}
        </div>
        {r.pain_level != null && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">痛みの強さ</p>
            <PainLevel level={r.pain_level} />
          </div>
        )}
      </Card>

      {/* お悩み箇所 */}
      <Card title="お悩み箇所">
        <BodyMapReadonly concerns={r.concerns} gender={r.gender} />
      </Card>

      {/* 健康状態（禁忌確認） */}
      <Card title="健康状態（禁忌確認）">
        <div className="grid sm:grid-cols-2 gap-3">
          <Health label="医療機関に通院中" value={r.under_medical_care} detail={r.medical_care_detail} danger />
          <Health label="手術歴" value={r.surgery_history} detail={r.surgery_detail} />
          <Health label="服薬中" value={r.taking_medication} detail={r.medication_detail} />
          <Health label="アレルギー" value={r.has_allergy} detail={r.allergy_detail} />
          {r.gender === "female" && (
            <>
              <Health
                label="妊娠・出産経験"
                value={r.pregnancy_history}
                detail={r.postpartum_symptoms?.join("、") || null}
              />
              <div
                className={
                  "rounded-lg border p-3 " +
                  (r.currently_pregnant === "yes" || r.currently_pregnant === "unsure"
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200")
                }
              >
                <p className="text-xs text-gray-500">現在妊娠中・可能性</p>
                <p
                  className={
                    "font-medium " +
                    (r.currently_pregnant === "yes" || r.currently_pregnant === "unsure"
                      ? "text-red-700"
                      : "text-gray-900")
                  }
                >
                  {display.pregnancy(r.currently_pregnant)}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 体型・ダイエット */}
      {(r.current_weight_kg != null || r.target_weight_kg != null) && (
        <Card title="体型・ダイエット">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="現在体重" value={r.current_weight_kg} unit="kg" />
            <Stat label="目標体重" value={r.target_weight_kg} unit="kg" />
            <Stat label="BMI" value={bmi} />
            <Stat
              label="最大体重"
              value={r.max_weight_kg}
              unit="kg"
              sub={r.max_weight_age != null ? `${r.max_weight_age}歳時` : undefined}
            />
          </div>
          {r.postpartum_weight_change && r.postpartum_weight_change !== "na" && (
            <p className="mt-3 text-sm text-gray-600">
              産後の体型変化:{" "}
              {display.postpartumWeightChange(r.postpartum_weight_change)}
            </p>
          )}
        </Card>
      )}

      {/* 生活習慣 */}
      <Card title="生活習慣">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {r.lifestyle?.usual_posture?.length ? (
            <Field label="姿勢">
              {r.lifestyle.usual_posture.map((p) => display.posture(p)).join("、")}
            </Field>
          ) : null}
          <Field label="運動頻度">
            {display.exerciseFreq(r.lifestyle?.exercise_frequency ?? null)}
          </Field>
          <Field label="便通">
            {display.bowel(r.lifestyle?.bowel_movement ?? null)}
          </Field>
          {r.lifestyle?.sleep_hours != null && (
            <Field label="睡眠時間">{r.lifestyle.sleep_hours}時間</Field>
          )}
          {r.lifestyle?.sleep_quality?.length ? (
            <Field label="睡眠の質">
              {r.lifestyle.sleep_quality.map((s) => display.sleepQuality(s)).join("、")}
            </Field>
          ) : null}
          {r.lifestyle?.eating_habit?.length ? (
            <Field label="食習慣">
              {r.lifestyle.eating_habit.map((s) => display.eatingHabit(s)).join("、")}
            </Field>
          ) : null}
          <Field label="飲酒">{display.alcohol(r.lifestyle?.alcohol ?? null)}</Field>
          {r.lifestyle?.water_intake_l != null && (
            <Field label="水分摂取">{r.lifestyle.water_intake_l}L</Field>
          )}
          {r.lifestyle?.dietary_concerns && (
            <Field label="食事の気になる点">{r.lifestyle.dietary_concerns}</Field>
          )}
          {r.lifestyle?.supplements && (
            <Field label="サプリ">{r.lifestyle.supplements}</Field>
          )}
        </div>
      </Card>

      {/* 希望施術 */}
      {r.desired_treatment?.length > 0 && (
        <Card title="受けたい施術">
          <div className="flex flex-wrap gap-2">
            {r.desired_treatment.map((t) => (
              <span
                key={t}
                className="px-3 py-1 rounded-full text-sm bg-brand-50 text-brand-800 border border-brand-200"
              >
                {display.desiredTreatment(t)}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* 同意・署名 */}
      <Card title="同意・署名">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          <span>施術同意: {r.consent_treatment ? "✓ 同意" : "未同意"}</span>
          <span>個人情報同意: {r.consent_privacy ? "✓ 同意" : "未同意"}</span>
          <span>署名: {r.signature}</span>
        </div>
        {r.reviewed_by && (
          <p className="mt-2 text-xs text-gray-400">
            確認者: {r.reviewed_by} ・ {formatDateTime(r.reviewed_at)}
          </p>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// 表示用ヘルパー（サーバーコンポーネント内）
// ============================================================
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-bold text-brand-700 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-gray-400">{label}：</span>
      <span className="text-gray-900">{children}</span>
    </div>
  );
}

function Health({
  label,
  value,
  detail,
  danger,
}: {
  label: string;
  value: boolean | null;
  detail?: string | null;
  danger?: boolean;
}) {
  const isYes = value === true;
  return (
    <div
      className={
        "rounded-lg border p-3 " +
        (isYes && danger ? "border-red-300 bg-red-50" : "border-gray-200")
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{label}</p>
        <span
          className={
            "text-xs font-medium px-2 py-0.5 rounded-full " +
            (isYes
              ? danger
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-500")
          }
        >
          {value === true ? "はい" : value === false ? "いいえ" : "—"}
        </span>
      </div>
      {isYes && detail && (
        <p className="mt-1.5 text-sm text-gray-700">{detail}</p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: number | null;
  unit?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        {value != null ? value : "—"}
        {value != null && unit && (
          <span className="text-xs font-normal text-gray-500 ml-0.5">{unit}</span>
        )}
      </p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

function PainLevel({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={
            "w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium " +
            (n <= level
              ? level >= 4
                ? "bg-red-500 text-white"
                : "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-400")
          }
        >
          {n}
        </div>
      ))}
      <span className="ml-2 text-sm text-gray-500">{level} / 5</span>
    </div>
  );
}
