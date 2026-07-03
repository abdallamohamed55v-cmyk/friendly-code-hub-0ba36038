/** @doc Polls a DashScope video-generation task by task_id and returns normalized status/url for the chat media flow. */
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getAlibabaKey } from "../_shared/alibabaClient.ts";

const DS_BASE = "https://dashscope-intl.aliyuncs.com/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const jobId: string = String(body?.job_id || body?.id || "").trim();
    if (!jobId) return jsonResponse({ error: "job_id required" }, 400);
    const apiKey = await getAlibabaKey();
    const r = await fetch(`${DS_BASE}/tasks/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const j = await r.json();
    if (!r.ok) return jsonResponse({ error: j?.message || `poll ${r.status}` }, 502);
    const s = j?.output?.task_status;
    if (s === "SUCCEEDED") {
      const url = j?.output?.video_url
        || j?.output?.results?.[0]?.url
        || j?.output?.results?.video_url;
      return jsonResponse({ status: "succeeded", video_url: url, url });
    }
    if (s === "FAILED" || s === "UNKNOWN") {
      return jsonResponse({ status: "failed", error: j?.output?.message || s });
    }
    return jsonResponse({ status: "pending", raw_status: s });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
