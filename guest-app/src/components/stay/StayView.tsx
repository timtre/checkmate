import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import { PhaseSelector, StayPhase } from "@/components/stay/PhaseSelector";
import { PreArrivalPhase } from "@/components/stay/phases/PreArrivalPhase";
import { ArrivalPhase } from "@/components/stay/phases/ArrivalPhase";
import { First30MinsPhase } from "@/components/stay/phases/First30MinsPhase";
import { DuringStayPhase } from "@/components/stay/phases/DuringStayPhase";
import { CheckOutPhase } from "@/components/stay/phases/CheckOutPhase";
import { PostStayPhase } from "@/components/stay/phases/PostStayPhase";

const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80";

interface StayViewProps {
  propertyName: string;
  propertyImageUrl?: string;
  children?: ReactNode;
}

export function StayView({ propertyName, propertyImageUrl, children }: StayViewProps) {
  const [activePhase, setActivePhase] = useState<StayPhase>("arrival");

  const renderPhaseContent = () => {
    switch (activePhase) {
      case "pre-arrival":
        return <PreArrivalPhase />;
      case "arrival":
        return <ArrivalPhase />;
      case "first-30-mins":
        return <First30MinsPhase />;
      case "during-stay":
        return <DuringStayPhase />;
      case "check-out":
        return <CheckOutPhase propertyName={propertyName} />;
      case "post-stay":
        return <PostStayPhase propertyName={propertyName} />;
      default:
        return <ArrivalPhase />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 max-w-lg mx-auto">
      {/* Property Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white border-b border-border"
      >
        <div className="w-full h-80 overflow-hidden">
          <img
            src={propertyImageUrl || DEFAULT_IMAGE_URL}
            alt={`${propertyName} property`}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="px-4 py-6 flex flex-col gap-1.5">
          <h1 className="font-display font-semibold text-foreground text-2xl">
            {propertyName}
          </h1>
          <div className="flex flex-row gap-2">
            <div className="flex items-center gap-1 text-muted-foreground text-lg">
              <MapPin className="h-4" />
              <span>Malibu, CA</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-lg">
              <Calendar className="h-4" />
              <span>Jan 24 – 28, 2026 • 4 nights</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Phase Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-4 mb-4"
      >
        <PhaseSelector activePhase={activePhase} onPhaseChange={setActivePhase} />
      </motion.div>

      {/* Phase Content */}
      <div className="px-4 mt-4 mb-4">
        <AnimatePresence mode="wait">
          <div key={activePhase}>{renderPhaseContent()}</div>
        </AnimatePresence>
      </div>

      {children}
    </div>
  );
}
