import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

interface TableActionDropdownProps {
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onClose: () => void;
  width?: number;
  title?: string;
  iconSize?: number;
  buttonStyle?: React.CSSProperties;
  children: React.ReactNode;
}

export const TableActionDropdown: React.FC<TableActionDropdownProps> = ({
  isOpen,
  onToggle,
  onClose,
  width = 200,
  title = 'Actions',
  iconSize = 16,
  buttonStyle,
  children,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    right: number;
    maxHeight: number;
  } | null>(null);

  // Calculate coordinates when open
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updateCoords = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();

      // Check available space above the button
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // Always prefer opening on top unless space above is extremely cramped (< 180px)
      const openBelow = spaceAbove < 180 && spaceBelow > spaceAbove;

      const rightOffset = Math.max(8, window.innerWidth - rect.right);

      if (openBelow) {
        setCoords({
          top: rect.bottom + 6,
          right: rightOffset,
          maxHeight: Math.min(360, spaceBelow - 16),
        });
      } else {
        setCoords({
          bottom: window.innerHeight - rect.top + 6,
          right: rightOffset,
          maxHeight: Math.min(360, spaceAbove - 16),
        });
      }
    };

    updateCoords();

    // Listeners for outside click and scroll
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(e);
        }}
        style={{
          background: isOpen ? '#f3f4f6' : 'transparent',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isOpen ? '#111827' : '#4b5563',
          transition: 'all 0.12s ease',
          boxShadow: isOpen ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          ...buttonStyle,
        }}
        title={title}
      >
        <MoreHorizontal size={iconSize} />
      </button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            className="dropdown-menu table-action-dropdown-portal action-menu-container"
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : 'auto',
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : 'auto',
              right: `${coords.right}px`,
              width: `${width}px`,
              maxHeight: `${coords.maxHeight}px`,
              overflowY: 'auto',
              zIndex: 99999,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              boxShadow:
                '0 -8px 24px -4px rgba(0, 0, 0, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
              padding: '5px',
              animation: 'dropdownFadeUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>,
          document.body
        )}
    </div>
  );
};
