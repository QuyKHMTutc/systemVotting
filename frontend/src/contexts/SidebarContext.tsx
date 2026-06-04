import { createContext, useContext, useState } from 'react';

interface SidebarContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = 'explore_sidebar_open';

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Default to open (true) if nothing stored yet
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const setSidebarOpen = (open: boolean) => {
    setSidebarOpenState(open);
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch { /* noop if storage unavailable */ }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
