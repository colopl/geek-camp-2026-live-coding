/**
 * CLI mode - Terminal based interaction
 *
 * 【学習目標】
 *   - エージェント定義とCLIを分離する設計パターンを理解する
 *   - Mastra Playground（開発用UI）との併用方法を学ぶ
 *
 * lesson3と同じターミナルベースの対話型実行
 * `npm start` で実行
 */

import * as readline from "node:readline";
import { assistantAgent } from "./mastra/agents/assistant.js";

// ========== 色の定義 ==========
const colors = {
  reset: "\x1b[0m",
  user: "\x1b[36m", // シアン
  agent: "\x1b[35m", // マゼンタ
  error: "\x1b[31m", // 赤
  tool: "\x1b[33m", // 黄色（Tool用）
} as const;

// ========== 対話ループ ==========
async function chat(userInput: string) {
  try {
    const result = await assistantAgent.generate(userInput, {
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

    console.log(`${colors.agent}[Agent]${colors.reset}`, result.text);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`${colors.error}[Error]${colors.reset}`, error.message);
    } else {
      console.error(`${colors.error}[Error]${colors.reset}`, error);
    }
  }
}

// ========== メイン処理 ==========
console.log(
  `${colors.agent}[Agent]${colors.reset} こんにちは！何かお手伝いできることはありますか？`,
);
console.log(`${colors.user}(終了するには Ctrl+C を押してください)${colors.reset}\n`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `${colors.user}[You]${colors.reset} `,
});

rl.prompt();

rl.on("line", async (line: string) => {
  const trimmed = line.trim();
  if (trimmed) {
    await chat(trimmed);
  }
  rl.prompt();
});

rl.on("close", () => {
  console.log(`\n${colors.agent}[Agent]${colors.reset} さようなら！`);
  process.exit(0);
});
