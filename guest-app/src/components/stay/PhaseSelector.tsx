import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type StayPhase = "pre-arrival" | "arrival" | "first-30-mins" | "during-stay" | "check-out" | "post-stay";

interface PhaseSelectorProps {
  activePhase: StayPhase;
  onPhaseChange: (phase: StayPhase) => void;
}

const phases: { id: StayPhase; label: string; shortLabel: string }[] = [
  { id: "pre-arrival", label: "Pre-arrival", shortLabel: "Pre" },
  { id: "arrival", label: "Arrival & Check-in", shortLabel: "Arrival" },
  { id: "first-30-mins", label: "First 30 mins", shortLabel: "30 mins" },
  { id: "during-stay", label: "During stay", shortLabel: "Stay" },
  { id: "check-out", label: "Check-out", shortLabel: "Out" },
  { id: "post-stay", label: "Post-stay", shortLabel: "Post" },
];

export function PhaseSelector({ activePhase, onPhaseChange }: PhaseSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIndex = phases.findIndex((p) => p.id === activePhase);

  // Auto-scroll to active phase
  useEffect(() => {
    if (scrollRef.current) {
      const activeButton = scrollRef.current.children[activeIndex] as HTMLElement;
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeIndex]);

  return (
    <div className="relative">
      {/* Phase pills */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 pt-1 px-4 scrollbar-hide relative z-10"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {phases.map((phase, index) => {
          const isActive = phase.id === activePhase;
          const isPast = index < activeIndex;

          return (
            <button
              key={phase.id}
              onClick={() => onPhaseChange(phase.id)}
              className={cn(
                "relative flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : isPast
                    ? "bg-gray-100 text-primary hover:bg-gray-200 z-10"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 z-10",
              )}
            >
              <span className="hidden sm:inline">{phase.label}</span>
              <span className="sm:hidden">{phase.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
