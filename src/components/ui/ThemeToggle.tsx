'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { FiSun, FiMoon } from 'react-icons/fi';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore();

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-all"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
    </motion.button>
  );
}
