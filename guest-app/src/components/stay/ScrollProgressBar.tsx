import { useEffect, useRef, useState } from "react";

interface ScrollProgressBarProps {
  children: React.ReactNode;
}

export function ScrollProgressBar({ children }: ScrollProgressBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerTop = rect.top;
      const containerHeight = rect.height;
      const viewportHeight = window.innerHeight;

      // Calculate how much of the container has been scrolled past
      const scrolled = Math.max(0, -containerTop + viewportHeight * 0.3);
      const scrollableDistance = containerHeight;
      
      const newProgress = Math.min(100, Math.max(0, (scrolled / scrollableDistance) * 100));
      setProgress(newProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative flex gap-4" ref={containerRef}>
      {/* Progress bar track */}
      <div className="flex-shrink-0 w-1 bg-secondary rounded-full relative overflow-hidden">
        {/* Progress bar fill */}
        <div
          className="absolute top-0 left-0 w-full bg-gray-600 rounded-full transition-all duration-100"
          style={{ height: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-6">
        {children}
      </div>
    </div>
  );
}
