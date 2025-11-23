import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

import { ResizeHandle } from '@/components/atoms';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 600,
  isOpen,
  onToggle,
  className,
}) => {
  const [width, setWidth] = React.useState(defaultWidth);
  const [isDragging, setIsDragging] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Load saved width from localStorage
  React.useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth);
      }
    }
  }, [minWidth, maxWidth]);

  // Handle mouse down on resize handle
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Handle mouse move for resizing
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sidebarRef.current) return;

      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      let newWidth = e.clientX - sidebarRect.left;

      // Clamp width between min and max
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Save to localStorage
        localStorage.setItem('sidebar-width', width.toString());
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minWidth, maxWidth, width]);

  return (
    <>
      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        className={cn(
          'relative flex h-full flex-shrink-0 border-r border-border bg-muted/20 transition-all duration-300',
          !isOpen && 'w-0 overflow-hidden border-r-0',
          className
        )}
        style={isOpen ? { width: `${width}px` } : undefined}
      >
        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>

        {/* Resize Handle */}
        {isOpen && (
          <ResizeHandle
            onMouseDown={handleMouseDown}
            className="absolute right-0 top-0 z-10 h-full"
          />
        )}
      </div>

      {/* Toggle Button - Fixed position */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            'absolute left-0 top-4 z-20 h-8 w-8 rounded-r-lg border border-l-0 border-border bg-background shadow-sm transition-all hover:bg-accent',
            !isOpen && 'rounded-l-lg border-l'
          )}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>
    </>
  );
};

ResizableSidebar.displayName = 'ResizableSidebar';

export { ResizableSidebar };
