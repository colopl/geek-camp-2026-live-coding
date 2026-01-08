import * as readline from "node:readline";
import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import type { CoreMessage } from "@mastra/core/llm";
import { createTool } from "@mastra/core/tools";

// ========== 色の定義 ==========
const colors = {
  reset: "\x1b[0m",
  user: "\x1b[36m", // シアン
  agent: "\x1b[35m", // マゼンタ
  error: "\x1b[31m", // 赤
  tool: "\x1b[33m", // 黄色（Tool用）
} as const;

// ==========================================
// Lesson 3: Mastraで書き直す
// ==========================================
// 【学習目標】
//   - AIエージェントフレームワーク（Mastra）の使い方を理解する
//   - フレームワークが自動化してくれる部分を把握する
//   - Lesson 2との比較でフレームワークのメリットを体感する
//
// Lesson 2 との差分:
//   - while ループが不要（Mastraが管理）
//   - switch文が不要（Mastraが実行）
//   - Memory管理もMastraが担当
//   - コード行数が大幅に減る（127行 → 約60行）
// ==========================================

// ========== Agent（Mastraで定義） ==========
// GEMINI_API_KEYをGOOGLE_GENERATIVE_AI_API_KEYに設定
// @ai-sdk/googleはこの環境変数を自動的に読み取る
process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;

if (!process.env.GEMINI_API_KEY) {
  console.error(
    `${colors.error}[Error]${colors.reset} GEMINI_API_KEY が設定されていません。.envファイルを確認してください。`,
  );
  process.exit(1);
}

// ========== Toolの定義 ==========
const getCurrentTimeTool = createTool({
  id: "getCurrentTime",
  description: "現在の日時を取得する。ユーザーが時刻を聞いたときに使う。",
  execute: async () => {
    return new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  },
});

// ========== Agentの定義 ==========
const agent = new Agent({
  id: "assistant-agent",
  name: "Assistant Agent",
  instructions:
    "あなたは親切なアシスタントです。ユーザーの質問に丁寧に答えてください。必要に応じてツールを使ってください。",
  model: google("gemini-2.5-flash"),
  tools: { getCurrentTime: getCurrentTimeTool },
});

// ========== 対話ループ ==========
async function main() {
  // ========== Memory（会話履歴） ==========
  const messages: CoreMessage[] = [];

  console.log(
    `${colors.agent}[Agent]${colors.reset} こんにちは！質問があれば何でもお答えします。（終了: exit）\n`,
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.user}[You]${colors.reset} `,
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const userInput = line.trim();

    if (!userInput) {
      rl.prompt();
      return;
    }
    if (userInput === "exit") {
      console.log(`${colors.agent}[Agent]${colors.reset} さようなら！`);
      rl.close();
      return;
    }

    // ユーザーの入力をMemoryに追加
    messages.push({ role: "user", content: userInput });

    try {
      // Mastraで実行（ループ・Tool実行を自動処理）
      const result = await agent.generate(messages, {
        onStepFinish: (step) => {
          // Tool呼び出しを表示
          if (step.toolCalls && step.toolCalls.length > 0) {
            for (const toolCall of step.toolCalls) {
              console.log(
                `  ${colors.tool}[Agent] Toolを呼び出します →${colors.reset}`,
                toolCall.payload?.toolName,
              );
            }
          }
          // Tool実行結果を表示
          if (step.toolResults && step.toolResults.length > 0) {
            for (const toolResult of step.toolResults) {
              const rawResult = toolResult.payload?.result;
              let resultStr = "(結果なし)";
              if (rawResult != null) {
                resultStr = typeof rawResult === "string" ? rawResult : JSON.stringify(rawResult);
              }
              console.log(`  ${colors.tool}[App] Toolの実行結果 →${colors.reset}`, resultStr);
            }
          }
        },
      });

      // Agentの応答をMemoryに追加
      messages.push({ role: "assistant", content: result.text });

      console.log(`\n${colors.agent}[Agent]${colors.reset} ${result.text}\n`);
      rl.prompt();
    } catch (error) {
      console.error(
        `${colors.error}[Error]${colors.reset}`,
        error instanceof Error ? error.message : error,
      );
      rl.prompt();
    }
  });
}

main().catch(console.error);
