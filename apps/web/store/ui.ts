"use client"
import { create } from 'zustand'

type UIState = {
  calmMode: boolean
  toggleCalm: () => void
}

export const useUI = create<UIState>((set) => ({
  calmMode: false,
  toggleCalm: () => set((s) => ({ calmMode: !s.calmMode })),
}))

