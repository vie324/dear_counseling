/**
 * Claude API による問診事前サマリー生成。
 *
 * スタッフが問診内容を一目で把握できるよう、要約・おすすめ施術・禁忌・優先部位を
 * 構造化 JSON で生成する。ANTHROPIC_API_KEY が未設定の場合は null を返し、
 * 呼び出し側はサマリー無しで動作する（graceful degradation）。
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import type { AiSummary, CounselingRow } from "../db-types";
import { formatResponseAsText } from "../format";

const SummarySchema = z.object({
  summary: z
    .string()
    .describe("施術担当者向けの3行程度の要約。お客様の状態と目的が一目で分かるように。"),
  recommended_treatments: z
    .array(z.string())
    .describe(
      "おすすめの施術。可能な限り次のメニューから選ぶ: 骨盤矯正 / 猫背矯正 / 運動療法 / 食事指導 / インナーマッスル(EMS) / リンパケア"
    ),
  contraindications: z
    .array(z.string())
    .describe("施術上の禁忌・注意点。無ければ空配列。妊娠・ヘルニア・強い痛み・通院中などに注意。"),
  priority_areas: z
    .array(z.string())
    .describe("優先的にアプローチすべき部位やテーマ（例: 腰、骨盤、下半身、自律神経 など）"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("この提案の確信度。情報が少ない場合は低めに。0〜1。"),
});

const SYSTEM_PROMPT = `あなたは美容整体院兼エステサロンの経験豊富な施術プランナーです。
来院前の問診票をもとに、施術担当スタッフが一目で状況を把握できる事前サマリーを作成します。

ガイドライン:
- 要約はお客様の主訴・目的・体質傾向を踏まえ、簡潔で実用的に。
- おすすめ施術は問診内容（来院目的・お悩み・希望施術・生活習慣）から根拠をもって選ぶ。
- 禁忌は安全最優先で。妊娠中・妊娠の可能性、ヘルニア/側弯症/すべり症、痛みレベルが高い、医療機関通院中などは必ず注意点として挙げる。該当が無ければ空配列。
- 断定しすぎず、確信度は情報量に応じて正直に設定する。
- 日本語で、医療的な診断・治療行為の表現は避け、あくまで整体・エステの施術提案にとどめる。`;

export async function generateCounselingSummary(
  row: CounselingRow
): Promise<AiSummary | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  try {
    const client = new Anthropic();
    const responseText = formatResponseAsText(row);

    const message = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 10000,
      thinking: { type: "adaptive" },
      output_config: {
        format: zodOutputFormat(SummarySchema),
        effort: "medium",
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `次のお客様の問診票を読み、事前サマリーを作成してください。\n\n${responseText}`,
        },
      ],
    });

    return message.parsed_output ?? null;
  } catch (err) {
    console.error("[AI summary] generation failed:", err);
    return null;
  }
}
