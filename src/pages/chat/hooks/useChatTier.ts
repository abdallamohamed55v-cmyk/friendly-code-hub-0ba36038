import { useState } from "react";
import type { AgentDef, AgentModel } from "@/lib/agentRegistry";

export type MegsyTier = "lite" | "pro" | "max";
export type ResearchDepth = "lite" | "medium" | "max";

/**
 * Encapsulates state for the tier/model/agent selector and research depth
 * controls. Extracted from ChatPage to reduce re-render surface.
 */
export function useChatTier() {
  const [megsyTier, setMegsyTier] = useState<MegsyTier>("lite");
  const [userPlan, setUserPlan] = useState<string>("free");
  const [selectedModel, setSelectedModel] = useState<AgentModel | null>(null);
  const [tierMenuOpen, setTierMenuOpen] = useState(false);
  const [researchDepth, setResearchDepth] = useState<ResearchDepth>("medium");
  const [researchDepthOpen, setResearchDepthOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentDef | null>(null);

  return {
    megsyTier,
    setMegsyTier,
    userPlan,
    setUserPlan,
    selectedModel,
    setSelectedModel,
    tierMenuOpen,
    setTierMenuOpen,
    researchDepth,
    setResearchDepth,
    researchDepthOpen,
    setResearchDepthOpen,
    selectedAgent,
    setSelectedAgent,
  };
}
