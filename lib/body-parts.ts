/**
 * 身体図の部位と Section 4 のお悩みカテゴリ・選択肢のマッピング
 *
 * 各部位は ViewBox 200x500 上の自然な人体シルエット形状を持つ。
 * 全部位が組み合わさって全身シルエットを形成する。
 * 選択時にピンクで強調表示される。
 */

import type { ConcernCategory } from "./schema";

export type BodyView = "front" | "back";

export interface BodyPart {
  id: string;
  label: string;
  category: ConcernCategory;
  options: string[];
  pathFront?: string;
  pathBack?: string;
  /** ラベル表示位置（バッジ用） */
  labelPos?: { front?: { x: number; y: number }; back?: { x: number; y: number } };
  /** 性別フィルタ */
  genderOnly?: "female";
  /** シルエットの主構成要素か（trueなら背景として常に描画） */
  isSilhouette?: boolean;
}

// ============================================================
// SVG パス定義（座標は viewBox=200x500）
// ============================================================

// 頭
const HEAD_FRONT = "M78,33 a22,26 0 1,0 44,0 a22,26 0 1,0 -44,0 Z";
const HEAD_BACK = HEAD_FRONT;

// 顔（頭の下半分）
const FACE_FRONT = "M83,32 q17,10 34,0 q-2,22 -17,28 q-15,-6 -17,-28 z";

// 目（顔上の小さな領域）
const EYES_FRONT = "M86,28 q14,-6 28,0 q-3,8 -14,8 q-11,0 -14,-8 z";

// 首
const NECK = "M91,58 q9,-3 18,0 l2,18 q-11,3 -22,0 z";

// 肩
const SHOULDER_FRONT = "M50,76 q50,-6 100,0 l1,12 q-51,5 -102,0 z";
const SHOULDER_BACK = SHOULDER_FRONT;

// 上半身（胸）
const CHEST_FRONT = "M53,86 q47,-4 94,0 l-3,44 q-44,4 -88,0 z";

// 背中（背面のみ） - 肩甲骨〜中背
const BACK_UPPER = "M53,86 q47,-4 94,0 l-3,60 q-44,4 -88,0 z";

// 腹部
const ABDOMEN_FRONT = "M55,130 q45,5 90,0 l-3,52 q-42,5 -84,0 z";

// 腰（背面）
const LOWER_BACK = "M56,146 q44,5 88,0 l-3,52 q-41,5 -82,0 z";

// 骨盤・お尻（正面）
const HIP_FRONT = "M55,182 q45,8 90,0 l-3,40 q-42,9 -84,0 z";

// お尻（背面）
const HIP_BACK = "M55,198 q45,8 90,0 l-3,45 q-42,10 -84,0 z";

// 二の腕（正面：左右両方）
const ARM_UPPER_FRONT = `
M48,86 q-8,4 -10,14 l-3,55 q1,6 9,6 q8,0 9,-6 l-2,-55 q-2,-10 -3,-14 z
M152,86 q8,4 10,14 l3,55 q-1,6 -9,6 q-8,0 -9,-6 l2,-55 q2,-10 3,-14 z
`.trim();

// 前腕＋手
const HAND_FRONT = `
M33,161 q-3,35 -5,72 q-1,8 4,12 q5,3 10,0 q5,-4 4,-12 q-2,-36 -4,-72 z
M167,161 q3,35 5,72 q1,8 -4,12 q-5,3 -10,0 q-5,-4 -4,-12 q2,-36 4,-72 z
`.trim();

// 太もも（正面・背面共通）
const THIGH = `
M62,222 q15,5 30,0 l-3,80 q-2,7 -12,7 q-10,0 -12,-7 z
M108,222 q15,5 30,0 l-3,80 q-2,7 -12,7 q-10,0 -12,-7 z
`.trim();

// ふくらはぎ
const CALF = `
M69,303 q12,3 22,0 l-2,78 q-3,6 -9,6 q-6,0 -9,-6 z
M109,303 q12,3 22,0 l-2,78 q-3,6 -9,6 q-6,0 -9,-6 z
`.trim();

// 足
const FOOT = `
M66,379 q14,3 28,0 l-1,18 q-15,3 -27,0 z
M106,379 q14,3 28,0 l-1,18 q-15,3 -27,0 z
`.trim();

// ============================================================
// 部位定義
// ============================================================
export const BODY_PARTS: BodyPart[] = [
  // ---------- シルエット構成パーツ ----------
  {
    id: "head",
    label: "頭",
    category: "head_neck",
    options: ["頭が痛い・重い"],
    pathFront: HEAD_FRONT,
    pathBack: HEAD_BACK,
    isSilhouette: true,
    labelPos: { front: { x: 100, y: 36 }, back: { x: 100, y: 36 } },
  },
  {
    id: "face",
    label: "顔",
    category: "face",
    options: [
      "顔の歪み・左右差", "目の大きさ・高さ", "エラの張り", "頬骨のでっぱり",
      "たるみ", "二重あご", "ほうれい線", "シワ", "くすみ", "顎関節症",
      "クマ", "乾燥", "むくみ", "疲れ顔",
    ],
    pathFront: FACE_FRONT,
    labelPos: { front: { x: 100, y: 48 } },
  },
  {
    id: "neck",
    label: "首",
    category: "head_neck",
    options: ["首が凝る・痛い"],
    pathFront: NECK,
    pathBack: NECK,
    isSilhouette: true,
    labelPos: { front: { x: 100, y: 70 }, back: { x: 100, y: 70 } },
  },
  {
    id: "shoulder",
    label: "肩",
    category: "head_neck",
    options: ["肩が凝る・痛い", "四十肩・五十肩", "左右の高さが違う"],
    pathFront: SHOULDER_FRONT,
    pathBack: SHOULDER_BACK,
    isSilhouette: true,
    labelPos: { front: { x: 100, y: 84 }, back: { x: 100, y: 84 } },
  },
  {
    id: "chest",
    label: "胸",
    category: "head_neck",
    options: ["バストの位置・形", "猫背"],
    pathFront: CHEST_FRONT,
    isSilhouette: true,
    labelPos: { front: { x: 100, y: 110 } },
  },
  {
    id: "back_upper",
    label: "背中（肩甲骨）",
    category: "head_neck",
    options: ["肩甲骨・背中の凝り"],
    pathBack: BACK_UPPER,
    isSilhouette: true,
    labelPos: { back: { x: 100, y: 115 } },
  },
  {
    id: "abdomen",
    label: "お腹",
    category: "lower_back",
    options: ["下腹のぽっこり", "ウエストのくびれ", "腰のお肉"],
    pathFront: ABDOMEN_FRONT,
    isSilhouette: true,
    labelPos: { front: { x: 100, y: 158 } },
  },
  {
    id: "lower_back",
    label: "腰",
    category: "lower_back",
    options: ["腰が痛い・張る", "ヘルニア", "側弯症", "すべり症"],
    pathBack: LOWER_BACK,
    isSilhouette: true,
    labelPos: { back: { x: 100, y: 172 } },
  },
  {
    id: "hip",
    label: "骨盤・お尻",
    category: "lower_back",
    options: [
      "骨盤の歪み", "お尻のたるみ・大きさ", "下半身太り",
      "股関節に違和感・痛み", "坐骨神経痛",
    ],
    pathFront: HIP_FRONT,
    pathBack: HIP_BACK,
    isSilhouette: true,
    labelPos: {
      front: { x: 100, y: 203 },
      back: { x: 100, y: 220 },
    },
  },
  {
    id: "arm_upper",
    label: "二の腕",
    category: "head_neck",
    options: ["二の腕のたるみ", "前腕の太さ"],
    pathFront: ARM_UPPER_FRONT,
    pathBack: ARM_UPPER_FRONT,
    isSilhouette: true,
    labelPos: { front: { x: 36, y: 125 } },
  },
  {
    id: "hand",
    label: "腕・手",
    category: "head_neck",
    options: ["しびれ", "手の冷え"],
    pathFront: HAND_FRONT,
    pathBack: HAND_FRONT,
    isSilhouette: true,
    labelPos: { front: { x: 30, y: 200 } },
  },
  {
    id: "thigh",
    label: "太もも",
    category: "legs",
    options: ["太ももの太さ", "O脚・X脚"],
    pathFront: THIGH,
    pathBack: THIGH,
    isSilhouette: true,
    labelPos: { front: { x: 100, y: 260 }, back: { x: 100, y: 260 } },
  },
  {
    id: "calf",
    label: "ふくらはぎ",
    category: "legs",
    options: ["ふくらはぎの太さ", "脚のむくみ", "脚の冷え", "脚がつる"],
    pathFront: CALF,
    pathBack: CALF,
    isSilhouette: true,
    labelPos: { front: { x: 100, y: 340 }, back: { x: 100, y: 340 } },
  },
  {
    id: "foot",
    label: "足",
    category: "legs",
    options: ["外反母趾・内反小趾", "扁平足"],
    pathFront: FOOT,
    pathBack: FOOT,
    isSilhouette: true,
    labelPos: { front: { x: 100, y: 388 }, back: { x: 100, y: 388 } },
  },

  // ---------- 抽象カテゴリ（図外のチップとして表示） ----------
  // pathなし → BodyDiagramの右側にチップ表示で扱う
  {
    id: "eyes",
    label: "目",
    category: "eyes",
    options: ["目が疲れる", "目が乾く", "めまいがする", "立ちくらみ"],
  },
  {
    id: "systemic",
    label: "全身症状・体質",
    category: "systemic",
    options: [
      "疲れやすい", "体がだるい", "疲れが取れない", "自律神経の乱れ",
      "イライラしやすい", "落ち込みやすい", "やる気が出ない", "風邪をひきやすい",
      "天気に体調が左右される", "貧血気味", "血圧が高い", "血圧が低い",
      "体温が低い", "筋肉が少ない・弱い", "血糖値が高い", "中性脂肪が高い",
      "骨密度が低い", "便秘", "アレルギー", "アトピー性皮膚炎", "花粉症",
      "ぜんそく", "胃腸が弱い",
    ],
  },
  {
    id: "women_area",
    label: "女性のお悩み",
    category: "women",
    genderOnly: "female",
    options: [
      "産後骨盤", "生理痛", "生理不順", "無月経", "不妊症",
      "更年期障害", "不正出血", "PMS", "尿漏れ・頻尿",
    ],
  },
];

/**
 * カテゴリから関連部位を取得
 */
export function getPartsByCategory(category: ConcernCategory): BodyPart[] {
  return BODY_PARTS.filter((p) => p.category === category);
}

/**
 * 部位IDからBodyPartを取得
 */
export function getPartById(id: string): BodyPart | undefined {
  return BODY_PARTS.find((p) => p.id === id);
}

/**
 * 指定ビュー（正面/背面）でSVG上に表示する部位だけを返す
 */
export function getPartsForView(view: BodyView, gender?: string): BodyPart[] {
  return BODY_PARTS.filter((p) => {
    const hasPath = view === "front" ? p.pathFront : p.pathBack;
    if (!hasPath) return false;
    if (p.genderOnly === "female" && gender !== "female") return false;
    return true;
  });
}

/**
 * 図外チップ用：パスを持たない抽象カテゴリの部位
 */
export function getAbstractParts(gender?: string): BodyPart[] {
  return BODY_PARTS.filter((p) => {
    if (p.pathFront || p.pathBack) return false;
    if (p.genderOnly === "female" && gender !== "female") return false;
    return true;
  });
}
