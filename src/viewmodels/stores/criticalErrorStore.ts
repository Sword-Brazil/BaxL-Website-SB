import { create } from "zustand";
import type { AppErrorKind } from "@/models/domain/appErrors";

/** Erro grave em exibição (alerta fixo no topo da tela, até a pessoa dispensar ou tentar de novo). */
interface CriticalErrorState {
  kind: AppErrorKind | null;
  show: (kind: AppErrorKind) => void;
  clear: () => void;
}

export const useCriticalErrorStore = create<CriticalErrorState>()((set) => ({
  kind: null,
  show: (kind) => set({ kind }),
  clear: () => set({ kind: null }),
}));
