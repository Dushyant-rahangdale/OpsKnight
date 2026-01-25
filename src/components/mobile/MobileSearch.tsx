'use client';

import { useState, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MobileSearchProps = {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  suggestions?: string[];
  leftIcon?: ReactNode;
  rightAction?: ReactNode;
  autoFocus?: boolean;
};

export default function MobileSearch({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  suggestions = [],
  leftIcon,
  rightAction,
  autoFocus = false,
}: MobileSearchProps) {
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const filteredSuggestions = suggestions
    .filter(s => s.toLowerCase().includes(value.toLowerCase()))
    .slice(0, 5);
  const showSuggestions = isFocused && value.length > 0 && filteredSuggestions.length > 0;

  const handleChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(value);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    handleChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition',
            isFocused
              ? 'border-primary bg-white shadow-sm dark:bg-slate-950'
              : 'border-transparent bg-slate-100 dark:bg-slate-950/80'
          )}
        >
          {leftIcon || (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-400 dark:text-slate-500"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          )}

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
          />

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-white transition hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500"
              aria-label="Clear search"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {rightAction}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-900 dark:bg-slate-950">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                handleChange(suggestion);
                onSearch?.(suggestion);
              }}
              className={cn(
                'w-full px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800',
                index < filteredSuggestions.length - 1 &&
                  'border-b border-slate-100 dark:border-slate-800'
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Filter Chip component for filter UI
export function MobileFilterChip({
  label,
  active = false,
  count,
  onClick,
}: {
  label: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition',
        active
          ? 'border-transparent bg-primary text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-900 dark:bg-slate-950 dark:text-slate-200'
      )}
    >
      {label}
      {count !== undefined && <span className="text-[0.65rem] opacity-70">{count}</span>}
    </button>
  );
}
