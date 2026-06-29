import { RiskDetails } from "@/types";
import { create } from "zustand";

interface RiskState {
  currentRisk: RiskDetails | null;
  riskHistory: RiskDetails[];
  lastUpdated: string | null;

  // Actions
  updateRisk: (risk: RiskDetails) => void;
  addToHistory: (risk: RiskDetails) => void;
  clearRisk: () => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  currentRisk: null,
  riskHistory: [],
  lastUpdated: null,

  updateRisk: (risk: RiskDetails) =>
    set((state) => ({
      currentRisk: risk,
      riskHistory: [risk, ...state.riskHistory].slice(0, 100), // Keep last 100
      lastUpdated: new Date().toISOString(),
    })),

  addToHistory: (risk: RiskDetails) =>
    set((state) => ({
      riskHistory: [risk, ...state.riskHistory].slice(0, 100),
    })),

  clearRisk: () =>
    set({
      currentRisk: null,
      riskHistory: [],
      lastUpdated: null,
    }),
}));
