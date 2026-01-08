/**
 * Agent定義
 *
 * 【ポイント】
 *   - エージェントの定義をCLIから分離することで再利用性を高める
 *   - Mastra CLI (`npx mastra dev`) でPlayground UIから動作確認可能
 *   - .env の GOOGLE_GENERATIVE_AI_API_KEY を自動読み込み
 */

import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";

// @ai-sdk/google は GOOGLE_GENERATIVE_AI_API_KEY を自動読み取り
// .env に GOOGLE_GENERATIVE_AI_API_KEY を設定しておく

// ========== Toolの定義 ==========
const getCurrentTimeTool = createTool({
  id: "getCurrentTime",
  description: "現在の日時を取得する。ユーザーが時刻を聞いたときに使う。",
  execute: async () => {
    return new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  },
});

// ========== Agentの定義 ==========
export const assistantAgent = new Agent({
  id: "assistant-agent",
  name: "Assistant Agent",
  instructions:
    "あなたは親切なアシスタントです。ユーザーの質問に丁寧に答えてください。必要に応じてツールを使ってください。",
  model: google("gemini-2.5-flash"),
  tools: { getCurrentTime: getCurrentTimeTool },
});
