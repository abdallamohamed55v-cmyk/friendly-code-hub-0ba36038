/** @doc Creates a Kashier hosted payment session (card + Vodafone Cash wallet) and returns a checkout URL. */
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const KASHIER_MERCHANT_ID = Deno.env.get("KASHIER_MERCHANT_ID") ?? "";
const KASHIER_SECRET_KEY = Deno.env.get("KASHIER_SECRET_KEY") ?? "";
const KASHIER_MODE = (Deno.env.get("KASHIER_MODE") ?? "test").toLowerCase();
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CHECKOUT_BASE =
  KASHIER_MODE === "live"
    ? "https://checkout.kashier.io"
    : "https://checkout.kashier.io"; // same host, `mode` param toggles env

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
  const bytes = new Uint8Array(sig);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Allowed method presets: "card" | "wallet" | "both"
function resolveAllowedMethods(method: string): string {
  if (method === "vodafone_cash" || method === "wallet") return "wallet";
  if (method === "card") return "card";
  return "card,wallet";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    if (!KASHIER_MERCHANT_ID || !KASHIER_SECRET_KEY) {
      return jsonResponse(
        { error: "Kashier is not configured. Set KASHIER_MERCHANT_ID and KASHIER_SECRET_KEY." },
        500,
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const currency = String(body.currency || "EGP").toUpperCase();
    const method = String(body.method || "any"); // card | vodafone_cash | wallet | any
    const credits = Number(body.credits || 0);
    const plan = body.plan ? String(body.plan) : null;
    const displayLang = String(body.display || "ar").toLowerCase() === "en" ? "en" : "ar";
    const redirectUrl = body.redirect_url ? String(body.redirect_url) : null;

    if (!amount || amount <= 0) return jsonResponse({ error: "Invalid amount" }, 400);
    if (!["EGP", "SAR", "AED", "USD"].includes(currency)) {
      return jsonResponse({ error: "Unsupported currency" }, 400);
    }

    // Kashier expects amount as decimal string with 2 places
    const amountStr = amount.toFixed(2);
    const orderId = `mgs_${crypto.randomUUID().replace(/-/g, "").slice(0, 18)}`;

    // Record pending order using service role
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: insertErr } = await admin.from("kashier_orders").insert({
      user_id: userId,
      order_id: orderId,
      amount: Number(amountStr),
      currency,
      method,
      status: "pending",
      credits,
      plan,
    });
    if (insertErr) {
      console.error("kashier_orders insert failed", insertErr);
      return jsonResponse({ error: "Failed to create order" }, 500);
    }

    const path = `/?payment=${KASHIER_MERCHANT_ID}.${orderId}.${amountStr}.${currency}`;
    const hash = await hmacHex(KASHIER_SECRET_KEY, path);

    const webhookUrl = `${SUPABASE_URL}/functions/v1/kashier-webhook`;
    const merchantRedirect = redirectUrl
      ? redirectUrl
      : `${req.headers.get("origin") || "https://megsy.ai"}/billing/success?provider=kashier&order=${orderId}`;

    const params = new URLSearchParams({
      merchantId: KASHIER_MERCHANT_ID,
      orderId,
      amount: amountStr,
      currency,
      hash,
      mode: KASHIER_MODE === "live" ? "live" : "test",
      merchantRedirect,
      serverWebhook: webhookUrl,
      display: displayLang,
      allowedMethods: resolveAllowedMethods(method),
      metaData: JSON.stringify({ userId, credits, plan }),
      redirectMethod: "get",
      brandColor: "#7C3AED",
    });

    const checkoutUrl = `${CHECKOUT_BASE}/?${params.toString()}`;

    return jsonResponse({
      order_id: orderId,
      checkout_url: checkoutUrl,
      mode: KASHIER_MODE,
    });
  } catch (e) {
    console.error("kashier-checkout error", e);
    return jsonResponse({ error: (e as Error).message || "Server error" }, 500);
  }
});
