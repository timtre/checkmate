import { motion } from "framer-motion";
import { Clock, KeyRound, Sparkles, Briefcase, LogOut, HelpCircle } from "lucide-react";
import { InfoCard } from "@/components/ui/InfoCard";
import { ScrollProgressBar } from "@/components/stay/ScrollProgressBar";

export function CheckOutPhase() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0 }}
        className="bg-gray-50 rounded-2xl p-6 text-center mb-1"
      >
        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
          <LogOut className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Time to check out
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Thank you for staying at Coastal Haven. Safe travels, and we hope to welcome you again soon. If you need anything after check-out, I'm here to help.
        </p>
      </motion.div>

      <div className="pt-2"></div>

      <ScrollProgressBar>
        <InfoCard icon={Clock} title="What time is check-out?" delay={0}>
          <p>Check-out is at <span className="font-semibold text-foreground">11:00 AM</span>.</p>
        </InfoCard>

        <InfoCard icon={HelpCircle} title="Can I check out late?" delay={0.05}>
          <p>Late check-out depends on availability. Let me know and I'll check for you.</p>
        </InfoCard>

        <InfoCard icon={KeyRound} title="What do I do with the keys?" delay={0.1}>
          <p>No keys needed — simply close the door behind you.</p>
        </InfoCard>

        <InfoCard icon={Sparkles} title="Do I need to clean?" delay={0.15}>
          <p>No full cleaning required.</p>
          <p className="mt-2">Please take out the trash and leave used towels in the bathroom.</p>
        </InfoCard>

        <InfoCard icon={Briefcase} title="Can I store luggage after check-out?" delay={0.2}>
          <p>Luggage storage isn't available on-site, but I can suggest nearby lockers.</p>
        </InfoCard>
      </ScrollProgressBar>

      <div className="pb-2"></div>
    </motion.div>
  );
}
