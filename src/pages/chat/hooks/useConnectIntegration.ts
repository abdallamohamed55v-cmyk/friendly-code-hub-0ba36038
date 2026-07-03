import { useCallback } from "react";
import { toast } from "sonner";
import type { NavigateFunction } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Integration } from "@/lib/integrationsData";

interface UseConnectIntegrationParams {
  connectingApp: string | null;
  setConnectingApp: (id: string | null) => void;
  setPlusMenuOpen: (open: boolean) => void;
  navigate: NavigateFunction;
}

export const useConnectIntegration = ({
  connectingApp,
  setConnectingApp,
  setPlusMenuOpen,
  navigate,
}: UseConnectIntegrationParams) => {
  return useCallback(
    async (integration: Integration) => {
      if (connectingApp) return;
      setConnectingApp(integration.id);
      try {
        if (integration.type === "pipedream" && integration.pipedreamSlug) {
          const { data, error } = await supabase.functions.invoke("pipedream-connect", {
            body: { action: "create_token" },
          });
          if (error || data?.error || !data?.connect_link_url) {
            throw new Error(data?.error || error?.message || "Pipedream not configured");
          }
          const url = `${data.connect_link_url}&app=${encodeURIComponent(integration.pipedreamSlug)}`;
          window.open(url, "_blank", "noopener,noreferrer");
          toast.success(`Opening ${integration.name}…`);
          return;
        }
        if (integration.app === "github" || integration.app === "supabase") {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            toast.error("Please sign in to connect " + integration.name);
            navigate("/auth");
            return;
          }
          const startFn =
            integration.app === "github" ? "oauth-github-connect" : "supabase-oauth-start";
          const { data, error } = await supabase.functions.invoke(startFn, {
            body: { redirect_to: window.location.href },
          });
          if (error || data?.error || !data?.authorize_url) {
            throw new Error(data?.error || error?.message || "OAuth is not configured");
          }
          window.open(data.authorize_url, "github-oauth", "popup,width=720,height=820");
          toast.success(`Opening ${integration.name}…`);
          return;
        }

        setPlusMenuOpen(false);
        navigate(`/settings/integrations?app=${encodeURIComponent(integration.id)}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `${integration.name} failed`);
      } finally {
        setConnectingApp(null);
      }
    },
    [connectingApp, setConnectingApp, setPlusMenuOpen, navigate],
  );
};
