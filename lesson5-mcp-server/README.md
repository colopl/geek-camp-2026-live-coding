# Lesson 5: MCPサーバーを作る

「おみくじを引くTool」を持つMCPサーバーを作成する

## 指示

```
おみくじを引けるMCPサーバーを作成してください。
サーバー名はomikuji-server。
確率分布: 超大吉5%, 大吉15%, 吉30%, 中吉30%, 小吉15%, 末吉5%
TypeScript、単一ファイル、tsxで実行。
@modelcontextprotocol/sdk パッケージを使う。
```

## ヒント

- `@modelcontextprotocol/sdk`パッケージを使う
- `McpServer`でサーバー作成、`registerTool`でTool登録
- `StdioServerTransport`で通信

## Claude Codeへの登録（フルパス）

```json
{
  "mcpServers": {
    "omikuji-server": {
      "command": "npx",
      "args": ["tsx", "/path/to/lesson5-mcp-server/src/index.ts"]
    }
  }
}
```

## 起動確認

```bash
npm install
npm run start
```
