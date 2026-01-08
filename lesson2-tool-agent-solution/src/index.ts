import * as readline from "node:readline";
import { type Content, GoogleGenerativeAI, type Tool } from "@google/generative-ai";

// ========== 色の定義 ==========
const colors = {
  reset: "\x1b[0m",
  user: "\x1b[36m", // シアン
  agent: "\x1b[35m", // マゼンタ
  error: "\x1b[31m", // 赤
  tool: "\x1b[33m", // 黄色（Tool用）
} as const;

// ==========================================
// Lesson 2: Toolを追加したエージェント
// ==========================================
// 【学習目標】
//   - Toolの定義方法を理解する
//   - エージェントのLoop（判断→実行→観測→判断...）を理解する
//   - LLMがToolを呼び出す仕組みを体験する
//
// Lesson 1 との差分:
//   - Tool   ... getCurrentTime を追加
//   - Loop   ... Tool呼び出しがあれば実行して結果を返す
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

// ========== Tool（追加） ==========
const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "getCurrentTime",
        description: "現在の日時を取得する。ユーザーが時刻を聞いたときに使う。",
      },
    ],
  },
];

function executeGetCurrentTime(): string {
  return new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", tools });

// ========== Memory ==========
const memory: Content[] = [];

// エージェントのメイン処理
async function chat(userInput: string): Promise<string> {
  // ユーザーの入力をMemoryに追加
  memory.push({
    role: "user",
    parts: [{ text: userInput }],
  });

  // LLMに送信
  const chatSession = model.startChat({ history: memory.slice(0, -1) });
  let result = await chatSession.sendMessage(userInput);
  let response = result.response;

  // ========== Loop（追加）: Tool呼び出しがあれば実行 ==========
  // LLMが複数のToolを同時に呼び出す場合があるため、全て処理する
  while (true) {
    const functionCalls = response.functionCalls();
    if (!functionCalls?.length) break;

    const functionResponses = [];

    for (const fc of functionCalls) {
      console.log(`  ${colors.tool}[Agent] Toolを呼び出します →${colors.reset} `, fc.name);
      let funcResult: string;
      switch (fc.name) {
        case "getCurrentTime":
          funcResult = executeGetCurrentTime();
          break;
        default:
          funcResult = `Unknown tool: ${fc.name}`;
      }
      console.log(`  ${colors.tool}[App] Toolの実行結果 →${colors.reset} ${funcResult}`);
      functionResponses.push({
        functionResponse: { name: fc.name, response: { result: funcResult } },
      });
    }

    // 全てのTool実行結果をLLMに返す
    // LLMはこの結果を解釈して、最終的な回答を生成する
    result = await chatSession.sendMessage(functionResponses);
    response = result.response;
  }

  const text = response.text();

  // LLMの応答をMemoryに追加
  memory.push({
    role: "model",
    parts: [{ text }],
  });

  return text;
}

// ========== 対話ループ ==========
async function main() {
  console.log("=== Lesson 2: Toolを追加したエージェント ===");
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
