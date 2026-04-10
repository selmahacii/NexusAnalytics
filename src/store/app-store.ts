import { create } from 'zustand';

export type ViewId = 
  | 'dashboard' 
  | 'forecast' 
  | 'predictions'
  | 'customers'
  | 'inventory'

  | 'anomalies'
  | 'market'
  | 'models'
  | 'data-sources'
  | 'ai-assistant'
  | 'reports'
  | 'settings';

interface AppState {
  activeView: ViewId;
  sidebarCollapsed: boolean;
  mobileOpen: boolean;
  setActiveView: (view: ViewId) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  sidebarCollapsed: false,
  mobileOpen: false,
  setActiveView: (view) => set({ activeView: view, mobileOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileOpen: (open) => set({ mobileOpen: open }),
}));
