import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActiveAccount = {
  kind: "personal" | "workspace";
  id: string | null;
  name: string;
  avatarUrl: string | null;
  credits: number;
};

const DEFAULT: ActiveAccount = {
  kind: "personal",
  id: null,
  name: "",
  avatarUrl: null,
  credits: 0,
};

export function useActiveAccount(): ActiveAccount {
  const [account, setAccount] = useState<ActiveAccount>(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits, avatar_url, display_name")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled) return;
        setAccount({
          kind: "personal",
          id: user.id,
          name: profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
          credits: Number(profile?.credits) || 0,
        });
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return account;
}

export default useActiveAccount;
