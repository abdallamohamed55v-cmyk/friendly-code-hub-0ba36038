/** @doc Kashier server-to-server webhook: verifies signature, marks order paid, credits user. */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const KASHIER_PAYMENT_API_KEY = Deno.env.get("KASHIER_PAYMENT_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!KASHIER_PAYMENT_API_KEY) return new Response("Not configured", { status: 500 });

  const raw = await req.text();
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Kashier envelope: { event, data: { ..., signatureKeys: [...], signature: "..." } }
  const data = payload?.data ?? payload;
  const signature: string = data?.signature ?? payload?.signature ?? "";
  const signatureKeys: string[] = data?.signatureKeys ?? payload?.signatureKeys ?? [];

  if (!signature || !Array.isArray(signatureKeys) || signatureKeys.length === 0) {
    console.warn("kashier-webhook missing signature");
    return new Response("Missing signature", { status: 401 });
  }

  const queryString = signatureKeys
    .map((k) => `${k}=${data?.[k] ?? ""}`)
    .join("&");
  const expected = await hmacHex(KASHIER_PAYMENT_API_KEY, queryString);

  if (!timingSafeEqualHex(signature.toLowerCase(), expected.toLowerCase())) {
    console.warn("kashier-webhook signature mismatch");
    return new Response("Invalid signature", { status: 401 });
  }

  const orderId: string = data?.merchantOrderId ?? data?.orderId ?? "";
  const kashierRef: string = data?.orderReference ?? data?.transactionId ?? "";
  const status: string = String(data?.status ?? "").toUpperCase();
  const amount = Number(data?.amount ?? 0);

  if (!orderId) return new Response("No order id", { status: 400 });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error: fetchErr } = await admin
    .from("kashier_orders")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (fetchErr || !order) {
    console.error("kashier-webhook order not found", orderId, fetchErr);
    return new Response("Order not found", { status: 404 });
  }

  // Idempotency: only credit once
  const isPaid = ["SUCCESS", "CAPTURED", "PAID", "APPROVED"].includes(status);
  const isAlreadyProcessed = order.status === "paid";

  const newStatus = isPaid ? "paid" : status === "FAILED" ? "failed" : "pending";

  await admin
    .from("kashier_orders")
    .update({ status: newStatus, kashier_ref: kashierRef, raw: payload })
    .eq("order_id", orderId);

  if (isPaid && !isAlreadyProcessed && Number(order.credits) > 0) {
    // Increment user credits + log transaction
    const { data: profile } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", order.user_id)
      .maybeSingle();
    const currentCredits = Number(profile?.credits ?? 0);
    const newCredits = currentCredits + Number(order.credits);

    await admin.from("profiles").update({ credits: newCredits }).eq("id", order.user_id);

    if (order.plan) {
      await admin.from("profiles").update({ plan: order.plan }).eq("id", order.user_id);
    }

    await admin.from("credit_transactions").insert({
      user_id: order.user_id,
      amount: Number(order.credits),
      action_type: "subscription_purchase",
      description: `Kashier top-up (${order.method || "card"}) · ${amount} ${order.currency}`,
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
