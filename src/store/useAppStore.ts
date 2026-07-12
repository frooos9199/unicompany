import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  locale: 'ar' | 'en';
  toggleTheme: () => void;
  setLocale: (locale: 'ar' | 'en') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      locale: 'en',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newTheme === 'dark');
          }
          return { theme: newTheme };
        }),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'unicompany-settings' }
  )
);
