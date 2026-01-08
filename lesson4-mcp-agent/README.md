# Lesson 4: MCPで能力を後付けする

Memory あり / Loop あり / Tool あり / MCP あり

## 目的

lesson3のエージェントにDeepWiki MCPを接続し、「能力を後付けできる」を体感する。

## 指示

```
lesson3のエージェントにDeepWiki MCPを接続してください。
@mastra/mcp パッケージを使う
DeepWiki MCP URL: https://mcp.deepwiki.com/mcp
```

## ヒント

- `@mastra/mcp`パッケージを使う
- MCPClientでDeepWiki MCPに接続（URL: `https://mcp.deepwiki.com/mcp`）
- `mcpClient.listTools()`でツールをAgentに渡す

## セットアップ

```bash
npm install
```

## 実行

```bash
npm start
```

## 試してみる質問

- 「mastra-ai/mastraの概要を教えて」
- 「vercel/ai-sdkの主な機能は？」
- 「今何時？」（従来のgetCurrentTimeも使える）
