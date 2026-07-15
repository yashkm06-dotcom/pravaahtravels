import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onHomeClick: () => void;
}

export default function Breadcrumbs({ items, onHomeClick }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 py-3 px-4 bg-stone-50 border-b border-stone-150 text-xs text-stone-500 font-medium">
      <button
        onClick={onHomeClick}
        className="flex items-center space-x-1 hover:text-[#008080] transition-colors"
        title="Go to home"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="sr-only">Home</span>
      </button>

      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300 shrink-0" />
          {item.onClick && !item.active ? (
            <button
              onClick={item.onClick}
              className="hover:text-[#008080] hover:underline transition-colors focus:outline-none"
            >
              {item.label}
            </button>
          ) : (
            <span className={`truncate ${item.active ? 'text-[#008080] font-bold' : ''}`}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
