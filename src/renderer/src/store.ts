import { create } from "zustand";
import type { Account, Order } from "@shared/types";

interface AppState {
  account: Account | null;
  orders: Order[];
  dbDirectory: string;
  setAccount: (account: Account | null) => void;
  setOrders: (orders: Order[]) => void;
  setDbDirectory: (path: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  account: null,
  orders: [],
  dbDirectory: "",
  setAccount: (account) => set({ account }),
  setOrders: (orders) => set({ orders }),
  setDbDirectory: (dbDirectory) => set({ dbDirectory })
}));
