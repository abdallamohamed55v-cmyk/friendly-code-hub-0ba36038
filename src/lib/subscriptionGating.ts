import { FREE_MODEL_IDS } from "@/lib/modelDetails";

export const PAID_PLANS = ["starter", "pro", "elite", "business", "enterprise"];

export const isFreeModel = (modelId: string): boolean => {
  return FREE_MODEL_IDS.includes(modelId) || modelId.startsWith("megsy-lite");
};

export const isPaidUser = (plan: string | null | undefined): boolean => {
  return PAID_PLANS.includes((plan || "free").toLowerCase());
};

export const canUseModel = (modelId: string, plan: string | null | undefined): boolean => {
  return isFreeModel(modelId) || isPaidUser(plan);
};

export const canUseCodeWorkspace = (plan: string | null | undefined): boolean => {
  return isPaidUser(plan);
};
