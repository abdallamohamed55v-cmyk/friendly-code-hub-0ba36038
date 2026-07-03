/** @doc Megsy Coder — autonomous full-stack coding agent (plan → parallel tools → observe). Uses Lovable AI Gateway. SSE stream. */
import { corsHeaders } from "../_shared/cors.ts";

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type Msg =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

const SYSTEM = `You are Megsy Coder, an autonomous full-stack coding agent built by شركة ميغسي.
NEVER mention any underlying AI provider or model name. You are Megsy — that's it.

WORKFLOW (agentic loop):
1. Briefly analyze the request (1 sentence).
2. Call \`todo_write\` with a numbered plan (3-8 concrete steps).
3. If the project would benefit from GitHub or Supabase, call \`request_integration\` early so the user can Connect or Skip.
4. For each step: issue MULTIPLE tool calls IN PARALLEL in the SAME assistant message (batch write_file together — 5-15 files per message).
5. After batches, call \`bash\` for install/build/test. Observe output; if errors, use \`read_file\` + \`edit_file\` to repair, then re-run.
6. Update \`todo_write\` as steps complete (done: true).
7. Call \`finish\` with a short summary.

RULES:
- Stack: Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Supabase.
- Full production code, no TODOs, no placeholders.
- Always create: package.json, index.html, vite.config.ts, tsconfig.json, tailwind.config.ts, src/main.tsx, src/App.tsx, src/index.css, README.md.
- Reply in the user's language (Arabic if they wrote Arabic).`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "todo_write",
      description: "Create/update the visible plan. Pass the FULL updated todo list each call.",
      parameters: {
        type: "object",
        properties: {
          todos: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                done: { type: "boolean" },
              },
              required: ["id", "title", "done"],
            },
          },
        },
        required: ["todos"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create or overwrite a file with full contents.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_file",
      description: "Replace an exact string in an existing file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          old_string: { type: "string" },
          new_string: { type: "string" },
        },
        required: ["path", "old_string", "new_string"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the current contents of a session file.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bash",
      description: "Simulated shell command (npm install/build/test). Returns emulated output.",
      parameters: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "python",
      description: "Run a short Python 3 snippet for calculations/data shaping. Returns stdout.",
      parameters: {
        type: "object",
        properties: { code: { type: "string" } },
        required: ["code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_integration",
      description:
        "Show a Connect/Skip card for GitHub or Supabase. Call early if the project needs that integration.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["github", "supabase"] },
          reason: { type: "string" },
        },
        required: ["kind", "reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finish",
      description: "Call when the project is complete. Provide a short user-facing summary.",
      parameters: {
        type: "object",
        properties: { summary: { type: "string" } },
        required: ["summary"],
      },
    },
  },
];

function execTool(
  name: string,
  args: any,
  files: Map<string, string>,
): { ok: boolean; result: string } {
  try {
    if (name === "write_file") {
      files.set(args.path, String(args.content ?? ""));
      return { ok: true, result: `wrote ${args.path} (${String(args.content ?? "").length} chars)` };
    }
    if (name === "edit_file") {
      const cur = files.get(args.path);
      if (cur === undefined) return { ok: false, result: `file not found: ${args.path}` };
      if (!cur.includes(args.old_string))
        return { ok: false, result: `old_string not found in ${args.path}` };
      files.set(args.path, cur.replace(args.old_string, args.new_string));
      return { ok: true, result: `edited ${args.path}` };
    }
    if (name === "read_file") {
      const cur = files.get(args.path);
      if (cur === undefined) return { ok: false, result: `file not found: ${args.path}` };
      return { ok: true, result: cur.slice(0, 4000) };
    }
    if (name === "bash") {
      const cmd = String(args.command || "");
      if (/npm (install|i|ci)|bun install/i.test(cmd))
        return { ok: true, result: "packages installed (simulated)" };
      if (/npm run build|vite build/i.test(cmd)) {
        if (!files.has("src/main.tsx") && !files.has("src/main.ts") && !files.has("index.html"))
          return { ok: false, result: "build failed: missing entry (src/main.tsx or index.html)" };
        return { ok: true, result: "build ok (simulated)" };
      }
      if (/npm run dev|vite/i.test(cmd)) return { ok: true, result: "dev server started on :5173 (simulated)" };
      return { ok: true, result: `$ ${cmd}\n(simulated ok)` };
    }
    if (name === "python") {
      return { ok: true, result: "(python simulated — output not captured server-side)" };
    }
    if (name === "todo_write") return { ok: true, result: "todo updated" };
    if (name === "request_integration") return { ok: true, result: "integration card shown to user" };
    if (name === "finish") return { ok: true, result: "finished" };
    return { ok: false, result: `unknown tool: ${name}` };
  } catch (e) {
    return { ok: false, result: (e as Error).message };
  }
}

function sseLine(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callModel(
  key: string,
  messages: Msg[],
): Promise<{ message: any; error?: string }> {
  const resp = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Lovable-API-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      parallel_tool_calls: true,
      temperature: 0.3,
      stream: false,
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    return { message: null, error: `model error ${resp.status}: ${t.slice(0, 400)}` };
  }
  const data = await resp.json();
  return { message: data?.choices?.[0]?.message };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const prompt = String(body?.prompt || "").trim();
  const history: Msg[] = Array.isArray(body?.history) ? body.history : [];
  if (!prompt) {
    return new Response(JSON.stringify({ error: "prompt required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const files = new Map<string, string>();
  const messages: Msg[] = [
    { role: "system", content: SYSTEM },
    ...history,
    { role: "user", content: prompt },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (o: unknown) => controller.enqueue(enc.encode(sseLine(o)));

      try {
        send({ event: "start", model: "megsy-coder" });

        const MAX_STEPS = 25;
        for (let step = 0; step < MAX_STEPS; step++) {
          const { message, error } = await callModel(key, messages);
          if (error) {
            send({ event: "error", error });
            break;
          }
          if (!message) {
            send({ event: "error", error: "empty model response" });
            break;
          }

          if (message.content && typeof message.content === "string") {
            send({ event: "text", text: message.content });
          }

          const toolCalls: ToolCall[] = Array.isArray(message.tool_calls) ? message.tool_calls : [];

          messages.push({
            role: "assistant",
            content: message.content ?? null,
            tool_calls: toolCalls.length ? toolCalls : undefined,
          });

          if (toolCalls.length === 0) {
            send({ event: "done", files: Array.from(files.entries()).map(([path, content]) => ({ path, content })) });
            break;
          }

          let finished = false;
          for (const tc of toolCalls) {
            let args: any = {};
            try {
              args = JSON.parse(tc.function.arguments || "{}");
            } catch {
              args = {};
            }
            send({ event: "tool_call", id: tc.id, name: tc.function.name, args });

            const { ok, result } = execTool(tc.function.name, args, files);

            if (tc.function.name === "write_file" && ok) {
              send({ event: "file", path: args.path, content: String(args.content ?? "") });
            } else if (tc.function.name === "edit_file" && ok) {
              const cur = files.get(args.path) ?? "";
              send({ event: "file", path: args.path, content: cur });
            } else if (tc.function.name === "todo_write") {
              send({ event: "todo", todos: args.todos || [] });
            } else if (tc.function.name === "bash") {
              send({ event: "bash", command: args.command, output: result, ok });
            } else if (tc.function.name === "python") {
              send({ event: "python", code: args.code, output: result, ok });
            } else if (tc.function.name === "request_integration") {
              send({ event: "integration", kind: args.kind, reason: args.reason });
            }

            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: result,
            });

            if (tc.function.name === "finish") {
              send({
                event: "done",
                summary: args.summary || "",
                files: Array.from(files.entries()).map(([path, content]) => ({ path, content })),
              });
              finished = true;
              break;
            }
          }
          if (finished) break;
          if (step === MAX_STEPS - 1) {
            send({
              event: "done",
              summary: "stopped: max steps reached",
              files: Array.from(files.entries()).map(([path, content]) => ({ path, content })),
            });
          }
        }
      } catch (e) {
        send({ event: "error", error: (e as Error).message });
      } finally {
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
});
