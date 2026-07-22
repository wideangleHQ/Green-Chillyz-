'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { evaluatePasswordStrength } from '@/lib/validation/authSchemas';

interface PasswordStrengthMeterProps {
  password?: string;
  showRequirements?: boolean;
}

export function PasswordStrengthMeter({ password = '', showRequirements = true }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label, color, text, requirements } = evaluatePasswordStrength(password);

  return (
    <div className="mt-2 space-y-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
          <motion.div
            className={`h-full ${color}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        {label && (
          <span className={`font-semibold capitalize tracking-wider shrink-0 ${text}`}>
            {label}
          </span>
        )}
      </div>

      {showRequirements && (
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {requirements.map((r) => (
            <div
              key={r.id}
              className={`flex items-center gap-1.5 text-[11px] transition-colors duration-200 ${
                r.passed ? 'text-brand-green font-medium' : 'text-slate-400'
              }`}
            >
              {r.passed
                ? <Check className="size-3.5 shrink-0 text-brand-green" strokeWidth={2.5} />
                : <X className="size-3.5 shrink-0 text-slate-300" strokeWidth={2} />}
              <span>{r.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
