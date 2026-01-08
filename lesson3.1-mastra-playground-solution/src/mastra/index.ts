/**
 * Mastraインスタンスの定義
 *
 * エージェントを登録してMastraインスタンスを作成します。
 * Mastra CLIがこのファイルを自動的に読み込みます。
 */

import { Mastra } from "@mastra/core/mastra";
import { assistantAgent } from "./agents/assistant.js";

export const mastra = new Mastra({
  agents: { assistantAgent },
});
