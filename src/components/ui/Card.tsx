'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  glass?: boolean;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, glass = false, hover = true, className = '', onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        rounded-2xl p-6 transition-all duration-300
        ${glass
          ? 'glass'
          : 'bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-lg'
        }
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
