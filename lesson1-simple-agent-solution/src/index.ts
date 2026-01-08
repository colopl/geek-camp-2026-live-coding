import * as readline from "node:readline";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ========== 色の定義 ==========
const colors = {
  reset: "\x1b[0m",
  user: "\x1b[36m", // シアン
  agent: "\x1b[35m", // マゼンタ
  error: "\x1b[31m", // 赤
} as const;

// ==========================================
// Lesson 1: ツールなしの最小限エージェント
// ==========================================
// 【学習目標】
//   - LLMへの問い合わせ方法を理解する
//   - 会話履歴（Memory）の管理方法を理解する
//   - エージェントの最小構成を体験する
//
// 4部品:
//   - LLM    ... 判断（line 17）
//   - Memory ... 履歴保持（line 20）
//   - Loop   ... Toolがないので必要性が薄い
//   - Tool   ... なし
//
// → Lesson 2でToolを追加すると、Loopが意味を持つ
//   （判断→実行→観測→判断...のサイクル）
// ==========================================

// ========== 環境変数チェック ==========
if (!process.env.GEMINI_API_KEY) {
  console.error(
    `${colors.error}[Error]${colors.reset} GEMINI_API_KEY が設定されていません。.envファイルを確認してください。`,
  );
  process.exit(1);
}

// ========== LLM ==========
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ========== Memory ==========
const memory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

// エージェントのメイン処理
async function chat(userInput: string): Promise<string> {
  // ユーザーの入力をMemoryに追加
  memory.push({
    role: "user",
    parts: [{ text: userInput }],
  });

  // LLMに送信
  // history: 最後のメッセージ（今回のユーザー入力）を除いた履歴を渡す
  // sendMessage: 今回のユーザー入力を送信
  const chatSession = model.startChat({ history: memory.slice(0, -1) });
  const result = await chatSession.sendMessage(userInput);
  const response = result.response.text();

  // LLMの応答をMemoryに追加
  memory.push({
    role: "model",
    parts: [{ text: response }],
  });

  return response;
}

// ========== 対話ループ（※エージェントのLoopとは別物） ==========
// これは「ユーザー入力を待つ」ループ
// エージェントのLoopは「タスク完了まで判断→実行を繰り返す」こと
async function main() {
  console.log("=== Lesson 1: ツールなしエージェント ===");
  console.log('終了するには "exit" と入力してください\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const promptUser = () => {
    rl.question(`${colors.user}You:${colors.reset} `, async (input) => {
      const userInput = input.trim();

      if (userInput.toLowerCase() === "exit") {
        console.log("さようなら！");
        rl.close();
        return;
      }

      if (!userInput) {
        promptUser();
        return;
      }

      try {
        const response = await chat(userInput);
        console.log(`\n${colors.agent}Agent:${colors.reset} ${response}\n`);
      } catch (error) {
        console.error(
          `${colors.error}[Error]${colors.reset}`,
          error instanceof Error ? error.message : error,
        );
      }

      promptUser();
    });
  };

  promptUser();
}

main();
