import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}
export function InfoCard({
  icon: Icon,
  title,
  children,
  className,
  delay = 0
}: InfoCardProps) {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.4,
    delay
  }} className={cn("bg-card rounded-2xl", className)}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground mb-1">{title}</h3>
          <div className="text-muted-foreground text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </motion.div>;
}