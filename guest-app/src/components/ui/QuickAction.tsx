import { motion } from "framer-motion";
import { LucideIcon, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  to: string;
  className?: string;
  delay?: number;
}

export function QuickAction({ icon: Icon, label, to, className, delay = 0 }: QuickActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link
        to={to}
        className={cn(
          "flex items-center justify-between p-4 bg-card rounded-xl border border-border/50 shadow-soft hover:shadow-medium transition-all group",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Icon className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
          </div>
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </Link>
    </motion.div>
  );
}
