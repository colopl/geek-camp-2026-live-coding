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
  mcp: "\x1b[32m", // 緑（MCP用）
} as const;

// ==========================================
// Lesson 4: MCPで能力を後付けする
// ==========================================

// ========== 環境変数の設定 ==========
process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;

if (!process.env.GEMINI_API_KEY) {
  console.error(
    `${colors.error}[Error]${colors.reset} GEMINI_API_KEY が設定されていません。.envファイルを確認してください。`,
  );
  process.exit(1);
}

// ========== Toolの定義（従来のTool） ==========
const getCurrentTimeTool = createTool({
  id: "getCurrentTime",
  description: "現在の日時を取得する。ユーザーが時刻を聞いたときに使う。",
  execute: async () => {
    return new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  },
});

// ========== メイン処理 ==========
async function main() {
  // ========== Agentの定義 ==========
  const agent = new Agent({
    id: "assistant-agent",
    name: "Assistant Agent",
    instructions: `あなたは親切なアシスタントです。ユーザーの質問に丁寧に答えてください。
必要に応じてツールを使ってください。
GitHubリポジトリについての質問には、DeepWikiツールを使って情報を取得してください。`,
    model: google("gemini-2.5-flash"),
    tools: {
      getCurrentTime: getCurrentTimeTool,
    },
  });

  console.log(
    `\n${colors.agent}[Agent]${colors.reset} こんにちは！質問があれば何でもお答えします。`,
  );
  console.log(
    `${colors.agent}[Agent]${colors.reset} GitHubリポジトリについても質問できます。（終了: exit）\n`,
  );

  // ========== Memory（会話履歴） ==========
  const messages: CoreMessage[] = [];

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
                `  ${colors.tool}[Tool] Toolを呼び出します →${colors.reset}`,
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
                const str = typeof rawResult === "string" ? rawResult : JSON.stringify(rawResult);
                resultStr = str.substring(0, 200) + (str.length > 200 ? "..." : "");
              }
              console.log(`  ${colors.tool}[App] 実行結果 →${colors.reset}`, resultStr);
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
