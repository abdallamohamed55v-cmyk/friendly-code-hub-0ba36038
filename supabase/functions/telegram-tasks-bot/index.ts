/** @doc Telegram bot that surfaces Megsy tasks and lets users react from chat. */
// Thin wrapper. Hosts two unrelated runtimes under one edge function to
// stay within the project's edge-function limit:
//   1. Telegram tasks bot webhook (default)
//   2. Telegram media storage (upload / refresh / proxy) — routed by URL path
import { handleTasksBotRequest } from "../_shared/tasks-bot.ts";
import { tryHandleTelegramStorage } from "../_shared/telegram-storage.ts";

Deno.serve(async (req) => {
  const storageResp = await tryHandleTelegramStorage(req);
  if (storageResp) return storageResp;
  return handleTasksBotRequest(req);
});
