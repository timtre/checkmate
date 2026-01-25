import { motion } from "framer-motion";
import { ChevronLeft, MoreVertical } from "lucide-react";

interface ChatHeaderProps {
  propertyName: string;
  stayDates: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function ChatHeader({ propertyName, stayDates, showBack = false, onBack }: ChatHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between px-4 py-4 bg-card border-b border-border"
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        <div>
          <h1 className="font-display font-semibold text-foreground text-lg leading-tight">
            {propertyName}
          </h1>
          {stayDates && <p className="text-sm text-muted-foreground">{stayDates}</p>}
        </div>
      </div>
      <button className="p-2 rounded-full hover:bg-secondary transition-colors">
        <MoreVertical className="h-5 w-5 text-muted-foreground" />
      </button>
    </motion.header>
  );
}
