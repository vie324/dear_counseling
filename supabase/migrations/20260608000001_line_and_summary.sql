-- ============================================================
-- Dear 美容整体 問診票 追加マイグレーション
-- 2026-06-08
--   - LINE連携用カラム（line_user_id）
--   - 初期マイグレーション適用後に実行してください
-- ============================================================

-- ---------- 顧客マスタに LINE ユーザーID ----------
alter table customers
  add column if not exists line_user_id text;

create unique index if not exists idx_customers_line_user_id
  on customers(line_user_id)
  where line_user_id is not null;

-- ---------- 問診回答に LINE ユーザーID / 表示名 ----------
alter table counseling_responses
  add column if not exists line_user_id text;

alter table counseling_responses
  add column if not exists line_display_name text;

create index if not exists idx_responses_line_user_id
  on counseling_responses(line_user_id)
  where line_user_id is not null;
