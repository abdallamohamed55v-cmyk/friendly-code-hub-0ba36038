import { useState } from "react";

/**
 * Encapsulates state for the integrations browser (connect dialog, search,
 * category filter, broken-logo cache, and the list of enabled user
 * integrations). Extracted from ChatPage to reduce re-render surface.
 */
export function useIntegrationsUi() {
  const [userIntegrations, setUserIntegrations] = useState<string[]>([]);
  const [connectingApp, setConnectingApp] = useState<string | null>(null);
  const [integrationsQuery, setIntegrationsQuery] = useState("");
  const [integrationsCategory, setIntegrationsCategory] = useState<string>("All");
  const [brokenLogos, setBrokenLogos] = useState<Record<string, boolean>>({});

  return {
    userIntegrations,
    setUserIntegrations,
    connectingApp,
    setConnectingApp,
    integrationsQuery,
    setIntegrationsQuery,
    integrationsCategory,
    setIntegrationsCategory,
    brokenLogos,
    setBrokenLogos,
  };
}
