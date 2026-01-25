import { motion } from "framer-motion";
import { ConciergeAvatar } from "./ConciergeAvatar";
import { Sparkles } from "lucide-react";

interface WelcomeCardProps {
  guestName?: string;
  propertyName: string;
}

export function WelcomeCard({ guestName, propertyName }: WelcomeCardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-gradient-to-br from-card via-card to-secondary/30 rounded-2xl p-6 mb-6 border border-border/50 shadow-medium"
    >
      <div className="flex items-start gap-4">
        <ConciergeAvatar size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Your Concierge
            </span>
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">
            {getGreeting()}{guestName ? `, ${guestName}` : ""}! 👋
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Welcome to <span className="font-medium text-foreground">{propertyName}</span>. 
            I'm here to make your stay effortless — from check-in details to local recommendations, 
            just ask me anything.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
