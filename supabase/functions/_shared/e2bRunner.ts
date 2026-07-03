/** @doc Shared E2B sandbox executor: picks an active e2b_keys row, spins up a sandbox via E2B REST API, runs a bash command, returns stdout/stderr. */
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function pickE2bKey(): Promise<{ id: string; api_key: string } | null> {
  const { data } = await supabase
    .from("e2b_keys")
    .select("id, api_key")
    .eq("status", "active")
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .limit(1)
    .maybeSingle();
  return data as any;
}

async function markE2bUsed(id: string, error?: string) {
  await supabase.from("e2b_keys").update({
    last_used_at: new Date().toISOString(),
    last_error: error || null,
  }).eq("id", id);
}

export interface BashResult { stdout: string; stderr: string; exit_code: number; error?: string }

export async function runBashInE2B(command: string, timeoutMs = 30000): Promise<BashResult> {
  const key = await pickE2bKey();
  if (!key) return { stdout: "", stderr: "", exit_code: -1, error: "No active E2B key" };

  try {
    // Create a sandbox
    const createRes = await fetch("https://api.e2b.dev/sandboxes", {
      method: "POST",
      headers: { "X-API-KEY": key.api_key, "Content-Type": "application/json" },
      body: JSON.stringify({ templateID: "base", timeout: Math.ceil(timeoutMs / 1000) }),
    });
    if (!createRes.ok) {
      const err = `E2B create failed: ${createRes.status}`;
      await markE2bUsed(key.id, err);
      return { stdout: "", stderr: "", exit_code: -1, error: err };
    }
    const sb = await createRes.json();
    const sbId = sb.sandboxID || sb.id;

    // Execute command
    const execRes = await fetch(`https://api.e2b.dev/sandboxes/${sbId}/process`, {
      method: "POST",
      headers: { "X-API-KEY": key.api_key, "Content-Type": "application/json" },
      body: JSON.stringify({ cmd: "/bin/bash", args: ["-c", command] }),
    });
    const exec = await execRes.json();

    // Cleanup
    fetch(`https://api.e2b.dev/sandboxes/${sbId}`, { method: "DELETE", headers: { "X-API-KEY": key.api_key } }).catch(() => {});

    await markE2bUsed(key.id);
    return {
      stdout: String(exec.stdout || "").slice(0, 6000),
      stderr: String(exec.stderr || "").slice(0, 2000),
      exit_code: Number(exec.exitCode ?? 0),
    };
  } catch (e) {
    await markE2bUsed(key.id, String(e));
    return { stdout: "", stderr: "", exit_code: -1, error: String(e) };
  }
}
