-- ============================================================
-- Dear 美容整体 問診票 初期マイグレーション
-- 2026-05-20
-- ============================================================
-- 適用方法:
--   Option A: Supabase ダッシュボード → SQL Editor にこのSQLを貼り付け実行
--   Option B: supabase CLI で `supabase db push`
-- ============================================================

-- ============================================================
-- 1. ENUM 型（PostgreSQL のネイティブENUMは変更コストが高いので
--    text + CHECK 制約で代替する。アプリ側の Zod スキーマと同期）
-- ============================================================

-- ============================================================
-- 2. customers（顧客マスタ）
-- ============================================================
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_kana text,
  birth_date date,
  gender text check (gender in ('female','male','other')),
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_customers_email on customers(email);
create index if not exists idx_customers_name_kana on customers(name_kana);

-- ============================================================
-- 3. counseling_invitations（来院前問診URLのトークン管理）
-- ============================================================
create table if not exists counseling_invitations (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  customer_id uuid references customers(id) on delete set null,
  reservation_date date,
  customer_name_hint text,        -- 招待発行時の顧客名（マッチング用）
  customer_phone_hint text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by text,                -- 発行したスタッフ
  created_at timestamptz not null default now()
);

create index if not exists idx_invitations_token on counseling_invitations(token);
create index if not exists idx_invitations_expires on counseling_invitations(expires_at);

-- ============================================================
-- 4. counseling_responses（問診票回答 メインテーブル）
-- ============================================================
create table if not exists counseling_responses (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid references counseling_invitations(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,

  -- ---------- Section 1: 基本情報 ----------
  name text not null,
  name_kana text,
  birth_date date,
  gender text check (gender in ('female','male','other')),
  phone text,
  email text,
  postal_code text,
  address text,
  occupation text,
  height_cm numeric(5,2),

  -- ---------- Section 2: 来院きっかけ ----------
  referral_source text check (referral_source in (
    'hotpepper','google','instagram','threads','facebook',
    'flyer','referral_customer','referral_staff','other'
  )),
  search_keyword text,
  referrer_name text,

  -- ---------- Section 3: 主訴 ----------
  chief_complaint text not null,
  visit_purpose text check (visit_purpose in (
    'body_shape','pain_relief','beauty','health','performance'
  )),

  -- ---------- Section 4: お悩み ----------
  concerns jsonb not null default '{}'::jsonb,
  -- 構造: { head_neck: ['頭痛','首こり'], lower_back: [...], ... }
  top_concern text,
  pain_level smallint check (pain_level between 1 and 5),
  symptom_duration text check (symptom_duration in (
    'within_week','within_month','within_3months','within_6months','over_year'
  )),

  -- ---------- Section 5: 健康状態 ----------
  under_medical_care boolean,
  medical_care_detail text,
  surgery_history boolean,
  surgery_detail text,
  taking_medication boolean,
  medication_detail text,
  has_allergy boolean,
  allergy_detail text,
  pregnancy_history boolean,
  postpartum_symptoms text[],
  currently_pregnant text check (currently_pregnant in ('yes','no','unsure')),

  -- ---------- Section 6: 体型・ダイエット ----------
  current_weight_kg numeric(5,2),
  target_weight_kg numeric(5,2),
  max_weight_kg numeric(5,2),
  max_weight_age smallint,
  min_weight_kg numeric(5,2),
  min_weight_age smallint,
  postpartum_weight_change text check (postpartum_weight_change in ('yes','no','na')),

  -- ---------- Section 7: 生活習慣 ----------
  lifestyle jsonb not null default '{}'::jsonb,
  -- 構造: {
  --   usual_posture: ['sitting','cross_legs'],
  --   exercise_frequency: 'weekly',
  --   bowel_movement: 'daily',
  --   sleep_hours: 7,
  --   sleep_quality: ['well'],
  --   eating_habit: ['normal'],
  --   dietary_concerns: '...',
  --   alcohol: 'sometimes',
  --   water_intake_l: 1.5,
  --   supplements: '...'
  -- }
  desired_treatment text[] not null default '{}',

  -- ---------- 同意・署名 ----------
  consent_treatment boolean not null default false,
  consent_privacy boolean not null default false,
  signature text not null,

  -- ---------- メタ情報 ----------
  ip_address inet,
  user_agent text,
  submitted_at timestamptz not null default now(),

  -- ---------- AI生成サマリー（後で埋める） ----------
  ai_summary jsonb,
  -- 構造: {
  --   summary: '3行サマリー...',
  --   recommended_treatments: ['pelvis','ems'],
  --   contraindications: ['妊娠中', 'ヘルニア'],
  --   priority_areas: ['lower_back','legs'],
  --   confidence: 0.85
  -- }
  ai_summary_generated_at timestamptz,

  -- ---------- アラートフラグ（禁忌） ----------
  is_high_risk boolean not null default false,
  high_risk_reasons text[],

  -- ---------- ステータス管理 ----------
  status text not null default 'submitted' check (status in (
    'submitted',      -- 顧客送信済み
    'reviewed',       -- スタッフ確認済み
    'completed',      -- 施術完了
    'archived'        -- アーカイブ
  )),
  reviewed_at timestamptz,
  reviewed_by text
);

create index if not exists idx_responses_submitted on counseling_responses(submitted_at desc);
create index if not exists idx_responses_customer on counseling_responses(customer_id);
create index if not exists idx_responses_status on counseling_responses(status);
create index if not exists idx_responses_high_risk on counseling_responses(is_high_risk)
  where is_high_risk = true;
create index if not exists idx_responses_phone on counseling_responses(phone);
create index if not exists idx_responses_email on counseling_responses(email);

-- ============================================================
-- 5. staff（店舗スタッフ - Supabase Auth と連携）
-- ============================================================
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  role text not null default 'staff' check (role in ('admin','staff')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staff_auth_user on staff(auth_user_id);

-- ============================================================
-- 6. トリガー: updated_at の自動更新
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_customers_updated_at on customers;
create trigger update_customers_updated_at
  before update on customers
  for each row execute function update_updated_at_column();

drop trigger if exists update_staff_updated_at on staff;
create trigger update_staff_updated_at
  before update on staff
  for each row execute function update_updated_at_column();

-- ============================================================
-- 7. 禁忌アラート自動判定トリガー
-- ============================================================
create or replace function check_high_risk()
returns trigger as $$
declare
  reasons text[] := array[]::text[];
begin
  -- 妊娠中 or 可能性あり
  if new.currently_pregnant in ('yes','unsure') then
    reasons := array_append(reasons, '妊娠中もしくは可能性あり');
  end if;

  -- ヘルニア・側弯症・すべり症
  if new.concerns->'lower_back' ? 'ヘルニア' then
    reasons := array_append(reasons, 'ヘルニア');
  end if;
  if new.concerns->'lower_back' ? '側弯症' then
    reasons := array_append(reasons, '側弯症');
  end if;
  if new.concerns->'lower_back' ? 'すべり症' then
    reasons := array_append(reasons, 'すべり症');
  end if;

  -- 痛みレベル 5
  if new.pain_level = 5 then
    reasons := array_append(reasons, '激しい痛み(レベル5)');
  end if;

  -- 通院中
  if new.under_medical_care = true then
    reasons := array_append(reasons, '医療機関通院中');
  end if;

  -- 結果を保存
  if array_length(reasons, 1) > 0 then
    new.is_high_risk := true;
    new.high_risk_reasons := reasons;
  else
    new.is_high_risk := false;
    new.high_risk_reasons := null;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists check_high_risk_trigger on counseling_responses;
create trigger check_high_risk_trigger
  before insert or update on counseling_responses
  for each row execute function check_high_risk();

-- ============================================================
-- 8. RLS（行レベルセキュリティ）
-- ============================================================
alter table customers enable row level security;
alter table counseling_invitations enable row level security;
alter table counseling_responses enable row level security;
alter table staff enable row level security;

-- 認証済みスタッフはすべての回答を閲覧可能
drop policy if exists "staff_read_responses" on counseling_responses;
create policy "staff_read_responses" on counseling_responses
  for select using (
    exists (
      select 1 from staff
      where auth_user_id = auth.uid() and is_active = true
    )
  );

drop policy if exists "staff_update_responses" on counseling_responses;
create policy "staff_update_responses" on counseling_responses
  for update using (
    exists (
      select 1 from staff
      where auth_user_id = auth.uid() and is_active = true
    )
  );

drop policy if exists "staff_read_customers" on customers;
create policy "staff_read_customers" on customers
  for all using (
    exists (
      select 1 from staff
      where auth_user_id = auth.uid() and is_active = true
    )
  );

drop policy if exists "staff_read_invitations" on counseling_invitations;
create policy "staff_read_invitations" on counseling_invitations
  for all using (
    exists (
      select 1 from staff
      where auth_user_id = auth.uid() and is_active = true
    )
  );

drop policy if exists "self_read_staff" on staff;
create policy "self_read_staff" on staff
  for select using (auth_user_id = auth.uid());

-- ⚠️ 公開フォーム送信は Service Role キーを使う Server Action 経由で行うため
--    counseling_responses への INSERT ポリシーは作らない（RLSバイパス）
-- ⚠️ counseling_invitations の閲覧（トークン検証）も Service Role で行う

-- ============================================================
-- 9. ビュー: 高リスク回答一覧
-- ============================================================
create or replace view high_risk_responses as
select
  id,
  name,
  phone,
  email,
  submitted_at,
  chief_complaint,
  high_risk_reasons,
  status
from counseling_responses
where is_high_risk = true
order by submitted_at desc;

-- ============================================================
-- 10. ヘルパー関数: トークン生成
-- ============================================================
create or replace function generate_invitation_token()
returns text as $$
declare
  -- URLセーフな短いトークン（base62風）
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i int;
begin
  for i in 1..12 loop
    result := result || substr(chars, floor(random() * 62 + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql;

-- ============================================================
-- 完了
-- ============================================================
