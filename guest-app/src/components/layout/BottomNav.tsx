import { motion } from "framer-motion";
import { Home, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveView = "stay" | "chat";

interface BottomNavProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const navItems: { icon: typeof Home; label: string; view: ActiveView }[] = [
  { icon: Home, label: "Stay", view: "stay" },
  { icon: MessageCircle, label: "Chat", view: "chat" },
];

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-50"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => onViewChange(item.view)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
