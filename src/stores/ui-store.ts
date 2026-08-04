"use client";

import { create } from "zustand";

import type { TransactionWithCategory } from "@/types/finance";

interface UiState {
  isQuickAddOpen: boolean;
  isMobileNavOpen: boolean;
  editingTransaction: TransactionWithCategory | null;
  openQuickAdd: (transaction?: TransactionWithCategory | null) => void;
  closeQuickAdd: () => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isQuickAddOpen: false,
  isMobileNavOpen: false,
  editingTransaction: null,
  openQuickAdd: (transaction = null) =>
    set({ isQuickAddOpen: true, editingTransaction: transaction }),
  closeQuickAdd: () => set({ isQuickAddOpen: false, editingTransaction: null }),
  openMobileNav: () => set({ isMobileNavOpen: true }),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
}));
