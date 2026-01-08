// ==========================================
// Lesson 5: MCPサーバーを作る（回答）
// ==========================================
// 【学習目標】
//   - MCPサーバーの作成方法を理解する
//   - 自分でToolを定義してMCPで提供する方法を学ぶ
//   - Lesson 4で使ったMCPクライアントの裏側を理解する
//
// 「おみくじを引くTool」を持つMCPサーバーを作成する
//
// ポイント:
//   - McpServer でサーバー本体を作成
//   - registerTool で Tool を登録
//   - StdioServerTransport で通信（標準入出力）
//     ※ stdout はMCPプロトコル通信に使うため、
//       ログ出力は console.error（stderr）を使用
//
// 確率分布:
//   超大吉: 5%, 大吉: 15%, 吉: 30%
//   中吉: 30%, 小吉: 15%, 末吉: 5%
// ==========================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// ========== おみくじの確率分布 ==========
const OMIKUJI_RESULTS = [
  { result: "超大吉", probability: 5 },
  { result: "大吉", probability: 15 },
  { result: "吉", probability: 30 },
  { result: "中吉", probability: 30 },
  { result: "小吉", probability: 15 },
  { result: "末吉", probability: 5 },
];

function drawOmikuji(): string {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const item of OMIKUJI_RESULTS) {
    cumulative += item.probability;
    if (random < cumulative) {
      return item.result;
    }
  }

  throw new Error("おみくじの結果が決定できませんでした");
}

// ========== MCPサーバーを作成 ==========
const server = new McpServer({
  name: "omikuji-server",
  version: "1.0.0",
});

// ========== Toolを登録 ==========
server.registerTool(
  "drawOmikuji",
  {
    description: "おみくじを引く。運勢を占いたいときに使う。",
  },
  async () => {
    const result = drawOmikuji();
    return {
      content: [{ type: "text", text: `🎍 ${result} 🎍` }],
    };
  },
);

// ========== サーバーを起動 ==========
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("Omikuji MCP Server started");
