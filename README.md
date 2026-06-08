# Dear 美容整体 問診票 / カウンセリングツール

エステサロン兼美容整体院向けの、来院前 Web 問診〜スタッフ管理ツールです。

```
LINEリッチメニュー → カウンセリングボタン → 問診フォーム入力 → 送信
                                                    ↓ 保存(Supabase)
                                    スタッフ管理画面で視認性高く表示
                                    （AI事前サマリー / 禁忌アラート / 人体図）
```

## 機能

### お客様側
- 📱 スマホ最適化された 7 セクションの問診フォーム（全58問）
- 🧍 クリッカブル人体図で部位を直感的に選択（正面/背面・ボトムシート）
- ✅ Zod による入力バリデーション（ステップごと＋送信時）
- 🎯 来院目的・性別に応じた項目の出し分け / スキップ
- 📲 **LINE連携（LIFF）**：リッチメニューから開くとお客様を自動識別

### スタッフ側（管理画面 `/admin`）
- 🔐 Supabase Auth によるスタッフログイン（RLS で保護）
- 📋 問診一覧（ステータス絞り込み・**禁忌アラート**強調）
- 🪪 **視認性の高い詳細ページ**：基本情報・主訴・人体図・健康状態・体型・生活習慣を一目で
- ✨ **AI 事前サマリー（Claude API）**：要約・おすすめ施術・禁忌・優先部位を自動生成
- 🚩 **禁忌アラート自動判定**（妊娠/ヘルニア/強い痛み/通院中など。DBトリガー）
- 🔗 **招待URL発行**：個別の問診URLを発行してお客様に共有
- 🔔 **新着のLINE通知**：問診が届くとスタッフのLINEへプッシュ

> **未設定でも動作します**：Supabase / Claude / LINE の環境変数が無い場合、フォームはデモ動作（ログ出力のみ）、AIサマリーやLINE通知はスキップされます。

---

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` を編集して各サービスの値を設定します（`.env.example` に説明あり）。
最低限 **Supabase の3つ** を設定すれば保存と管理画面が動きます。AI・LINE は任意です。

| 変数 | 用途 | 必須 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | DB / 認証 | ◯ |
| `SUPABASE_SERVICE_ROLE_KEY` | 公開フォーム送信時の保存（RLSバイパス） | ◯ |
| `ANTHROPIC_API_KEY` | AI事前サマリー生成 | 任意 |
| `NEXT_PUBLIC_LIFF_ID` | LINEリッチメニューからのフォーム表示 | 任意 |
| `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_CHANNEL_SECRET` / `LINE_STAFF_NOTIFY_TO` | スタッフへのLINE通知・Webhook | 任意 |
| `NEXT_PUBLIC_APP_URL` | 通知・招待URLの生成 | 任意 |

### 3. データベース（Supabase）

Supabase ダッシュボード → SQL Editor で、以下を順に実行します。

1. `supabase/migrations/20260520000001_initial.sql`（テーブル・禁忌判定トリガー・RLS）
2. `supabase/migrations/20260608000001_line_and_summary.sql`（LINE連携カラム）

または Supabase CLI で `supabase db push`。

### 4. スタッフアカウントの作成

1. Supabase ダッシュボード → Authentication → **Add user** でスタッフのメール/パスワードを作成
2. アプリの `/login` からそのアカウントでログイン
3. 初回は「スタッフ登録が必要です」と表示され、**実行すべき SQL がそのまま提示される**ので、Supabase の SQL Editor に貼って実行
4. 画面を再読み込みすると管理画面が使えます

### 5. ローカル起動

```bash
npm run dev   # → http://localhost:3000
```

- ランディング: `/`
- 問診票（デモ）: `/form/demo`
- スタッフ管理: `/admin`（未ログインなら `/login` へ）

---

## LINE 連携の設定（任意）

### A. フォームをリッチメニューから開く（LIFF）
1. LINE Developers で **LIFF** アプリを作成し、エンドポイントURLを `https://<your-app>/form/line` に設定
2. `NEXT_PUBLIC_LIFF_ID` に LIFF ID を設定
3. リッチメニューの「カウンセリング」ボタンのリンク先を LIFF URL（`https://liff.line.me/<LIFF_ID>`）に
4. お客様が開くと LINE プロフィール（userId）を取得し、回答に紐付けて保存します

### B. スタッフへの新着通知（Messaging API）
1. Messaging API チャネルの「チャネルアクセストークン（長期）」を `LINE_CHANNEL_ACCESS_TOKEN` に
2. 通知先のユーザーID/グループIDを `LINE_STAFF_NOTIFY_TO` に（カンマ区切りで複数可）
3. Webhook URL を `https://<your-app>/api/line/webhook` に設定（署名検証は `LINE_CHANNEL_SECRET` を使用）

---

## デプロイ（Vercel）

1. GitHub にプッシュ → Vercel で Import
2. **Environment Variables** に `.env.local` と同じ値を設定
3. Deploy

---

## ディレクトリ構成

```
app/
├── form/[token]/         # 問診票（page / actions=保存・通知）
├── admin/                # スタッフ管理画面
│   ├── layout.tsx        #   認証ゲート + ナビ
│   ├── page.tsx          #   問診一覧
│   ├── [id]/page.tsx     #   ★視認性の高い詳細ページ
│   ├── invitations/      #   招待URL発行
│   └── actions.ts        #   ログアウト / 招待発行
├── login/                # スタッフログイン
├── api/line/webhook/     # LINE Webhook
├── privacy/              # プライバシーポリシー
├── thanks/               # 送信完了
└── page.tsx              # ランディング
components/
├── form/                 # 問診フォーム・人体図
└── admin/                # サマリーカード/人体図表示/ステータス/招待
lib/
├── schema.ts             # Zodスキーマ（58問）
├── body-parts.ts         # 身体部位マッピング
├── db-types.ts           # DB行の型
├── format.ts             # 表示整形・age/BMI・enum→ラベル
├── response-mapper.ts    # フォーム→DB行 変換
├── ai/summary.ts         # Claude API による事前サマリー
├── line/                 # LINE クライアント / LIFF
├── auth.ts               # ログイン中スタッフ取得
└── supabase/             # Supabase クライアント(browser/server/admin/middleware)
supabase/migrations/      # DBスキーマ
```

---

## 技術スタック

- Next.js 15 (App Router) / TypeScript / Tailwind CSS
- React Hook Form + Zod / Radix UI
- Supabase（Postgres / Auth / RLS）
- Claude API（`@anthropic-ai/sdk`, モデル: Claude Opus 4.8）
- LINE LIFF / Messaging API

---

## 備考・今後の調整ポイント

- AI事前サマリーは**管理画面の詳細を開いたとき**に自動生成・保存されます（送信を遅延させないため）。再生成ボタンあり。
- 招待トークンの有効期限チェックは送信時には強制していません（紐付けは任意）。必要なら `actions.ts` で有効期限を検証してください。
- プライバシーポリシー（`/privacy`）は雛形です。実運用に合わせて文面を調整してください。

© 株式会社 vie
