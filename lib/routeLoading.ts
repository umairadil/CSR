import { create } from "zustand";

interface RouteLoadingState {
  isLoading: boolean;
  show: () => void;
  hide: () => void;
}

export const useRouteLoading = create<RouteLoadingState>((set) => ({
  isLoading: false,
  show: () => set({ isLoading: true }),
  hide: () => set({ isLoading: false }),
}));



