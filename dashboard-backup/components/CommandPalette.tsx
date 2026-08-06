'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, Ticket, Users, Wallet, HelpCircle, Settings, FileText, BarChart3, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    { name: 'Go to Dashboard', icon: <BarChart3 className="w-4 h-4 text-emerald-600" />, section: 'Navigation', action: () => router.push('/') },
    { name: 'Search Customers', icon: <Users className="w-4 h-4 text-emerald-600" />, section: 'Navigation', action: () => router.push('/customers') },
    { name: 'Wallet Ledgers', icon: <Wallet className="w-4 h-4 text-emerald-600" />, section: 'Navigation', action: () => router.push('/wallet') },
    { name: 'Redeem Voucher', icon: <Ticket className="w-4 h-4 text-emerald-600" />, section: 'Navigation', action: () => router.push('/vouchers') },
    { name: 'Rewards Catalog', icon: <Sparkles className="w-4 h-4 text-emerald-600" />, section: 'Navigation', action: () => router.push('/rewards') },
    { name: 'Audit Trail', icon: <FileText className="w-4 h-4 text-emerald-600" />, section: 'Navigation', action: () => router.push('/audit-logs') },
    { name: 'Settings', icon: <Settings className="w-4 h-4 text-emerald-600" />, section: 'Navigation', action: () => router.push('/settings') },
    { name: 'Support & Docs', icon: <HelpCircle className="w-4 h-4 text-emerald-600" />, section: 'Help', action: () => router.push('/settings') },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.section.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-9999 flex items-start justify-center pt-24 px-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative max-w-lg w-full bg-white dark:bg-zinc-950 border border-[var(--border)] rounded-xl shadow-heavy overflow-hidden flex flex-col"
        >
          {/* Input field */}
          <div className="flex items-center gap-3 px-4 border-b border-[var(--border)] bg-zinc-50 dark:bg-zinc-900/50">
            <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.5]" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search actions or navigate..."
              className="flex-1 py-4 text-sm text-[var(--foreground)] bg-transparent outline-none border-none placeholder-zinc-400 dark:placeholder-zinc-600 focus:ring-0 focus:border-none focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)] bg-white dark:bg-zinc-950 border border-[var(--border)] rounded shadow-sm">
              <span>ESC</span>
            </kbd>
          </div>

          {/* Command list */}
          <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd, idx) => {
                const isActive = idx === selectedIndex;
                return (
                  <button
                    key={cmd.name}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold'
                        : 'text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-[var(--color-on-primary)]' : ''}>
                        {cmd.icon}
                      </span>
                      <span>{cmd.name}</span>
                    </div>
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-[var(--color-on-primary)]/80' : 'text-[var(--text-muted)]'}`}>
                      {cmd.section}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-[var(--text-muted)]">
                <AlertTriangle className="w-8 h-8 text-amber-500/80 mb-2 stroke-[1.5]" />
                <p className="text-xs font-medium">No results found for "{search}"</p>
              </div>
            )}
          </div>

          {/* Footer instruction */}
          <div className="border-t border-[var(--border)] px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span>↑↓ Navigate</span>
              <span>•</span>
              <span>ENTER Execute</span>
            </div>
            <span>Store Command Center</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
