import { useState, useRef, useEffect, useMemo } from 'react';

export const VirtualTable = ({ items, rowHeight = 48, viewportHeight = 500, renderRow }) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Reset scroll top when items change to prevent layout discrepancies
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  const onScroll = (e) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = items.length * rowHeight;
  
  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.floor(scrollTop / rowHeight);
    const visibleRows = Math.ceil(viewportHeight / rowHeight);
    
    // Add 5 rows buffer above and below
    const buffer = 5;
    const startIndex = Math.max(0, start - buffer);
    const endIndex = Math.min(items.length, start + visibleRows + buffer);
    
    return { startIndex, endIndex };
  }, [scrollTop, items.length, rowHeight, viewportHeight]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const offsetTop = startIndex * rowHeight;

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="overflow-y-auto border border-cyber-border rounded-lg bg-cyber-dark/40"
      style={{ height: `${viewportHeight}px` }}
    >
      <div className="relative" style={{ height: `${totalHeight}px`, minWidth: '100%' }}>
        <div
          className="absolute left-0 right-0 top-0"
          style={{
            transform: `translate3d(0, ${offsetTop}px, 0)`,
            willChange: 'transform'
          }}
        >
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-cyber-textMuted py-20 font-mono text-sm">
              <span className="text-cyber-neonRed mb-2">&gt; NO RECORD FOUND</span>
              <span>Filter returned 0 results.</span>
            </div>
          ) : (
            visibleItems.map((item, index) => renderRow(item, startIndex + index))
          )}
        </div>
      </div>
    </div>
  );
};
