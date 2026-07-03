/** @doc Generates videos via Alibaba DashScope free-trial Wan video models. Uses ALIBABA_DASHSCOPE_KEY and silently rotates through free-tier T2V/I2V models on failure. Returns a `job_id` (DashScope task_id) callers poll via media-video-poll. */
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAlibabaKey } from "../_shared/alibabaClient.ts";

const DS_BASE = "https://dashscope-intl.aliyuncs.com/api/v1";

// Free-tier text-to-video models (quality → reliability).
const T2V_CHAIN = [
  "wan2.7-t2v-2026-04-25",
  "wan2.6-t2v",
  "wan2.5-t2v-preview",
  "wan2.2-t2v-plus",
  "wan2.1-t2v-plus",
  "wan2.1-t2v-turbo",
];

// Free-tier image-to-video / VACE (reference-image) models.
const I2V_CHAIN = [
  "wan2.1-vace-plus",
  "wan2.7-i2v",
  "wan2.7-i2v-2026-04-25",
  "wan2.6-i2v",
  "wan2.6-i2v-flash",
  "wan2.5-i2v-preview",
  "wan2.2-i2v-plus",
  "wan2.2-i2v-flash",
  "wan2.1-i2v-plus",
  "wan2.1-i2v-turbo",
];

const SIZE_MAP: Record<string, string> = {
  "1:1": "960*960",
  "16:9": "1280*720",
  "9:16": "720*1280",
};

async function submit(
  model: string,
  prompt: string,
  size: string,
  duration: number,
  startFrame: string | null,
  endFrame: string | null,
  apiKey: string,
) {
  const isVace = /vace/i.test(model);
  const endpoint = isVace
    ? `${DS_BASE}/services/aigc/video-generation/video-synthesis`
    : startFrame || endFrame
      ? `${DS_BASE}/services/aigc/video-generation/video-synthesis`
      : `${DS_BASE}/services/aigc/video-generation/video-synthesis`;

  const input: Record<string, unknown> = { prompt };
  if (startFrame) input.first_frame_url = startFrame;
  if (endFrame) input.last_frame_url = endFrame;
  if (isVace && startFrame) input.ref_images_url = [startFrame];

  const body = {
    model,
    input,
    parameters: {
      size,
      duration: Math.max(3, Math.min(10, duration | 0 || 5)),
      prompt_extend: true,
    },
  };

  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`submit ${r.status}: ${text.slice(0, 300)}`);
  const j = JSON.parse(text);
  const taskId = j?.output?.task_id;
  if (!taskId) throw new Error(`no task_id: ${text.slice(0, 200)}`);
  return taskId as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const prompt: string = String(body?.prompt || "").trim();
    if (!prompt) return jsonResponse({ error: "prompt required" }, 400);
    const size = SIZE_MAP[body?.aspect_ratio || "16:9"] || "1280*720";
    const duration = Number(body?.duration || 5);
    const startFrame: string | null = body?.start_frame || null;
    const endFrame: string | null = body?.end_frame || null;
    const requested = String(body?.model_slug || "").trim();

    const baseChain = startFrame || endFrame || /vace|i2v|r2v/i.test(requested)
      ? I2V_CHAIN
      : T2V_CHAIN;
    const chain = Array.from(new Set([
      requested && /^(wan|happyhorse)/i.test(requested) ? requested : baseChain[0],
      ...baseChain,
    ]));

    const apiKey = await getAlibabaKey();
    const errors: string[] = [];
    for (const model of chain) {
      try {
        const taskId = await submit(model, prompt, size, duration, startFrame, endFrame, apiKey);
        return jsonResponse({ job_id: taskId, id: taskId, model_used: model, status: "pending" });
      } catch (e) {
        errors.push(`${model}: ${String(e).slice(0, 200)}`);
        console.error(`[media-video] ${model} failed`, e);
      }
    }
    return jsonResponse({ error: "all_models_failed", message: errors.join(" | ") }, 502);
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
