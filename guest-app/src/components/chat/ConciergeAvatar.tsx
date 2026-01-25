import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConciergeAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ConciergeAvatar({ size = "md", className }: ConciergeAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent flex items-center justify-center shadow-soft",
        sizeClasses[size],
        className
      )}
    >
      <span className={cn(
        "font-display font-semibold text-primary",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-xl"
      )}>
        C
      </span>
      {/* Online indicator */}
      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-card rounded-full" />
    </motion.div>
  );
}
