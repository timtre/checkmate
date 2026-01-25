import { motion } from "framer-motion";
import { Clock, Key, AlertCircle, MapPin, Train, Moon } from "lucide-react";
import { InfoCard } from "@/components/ui/InfoCard";
import { ScrollProgressBar } from "@/components/stay/ScrollProgressBar";

export function PreArrivalPhase() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -10,
      }}
      transition={{
        duration: 0.2,
      }}
      className="space-y-3"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0 }}
        className="bg-gray-50 rounded-2xl p-6 text-center mb-1"
      >
        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
          <Clock className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">Your stay is coming up!</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          I'm here to make your arrival smooth and stress-free. If you're planning your arrival or have special timing,
          just let me know.
        </p>
      </motion.div>

      <div className="pt-2"></div>

      <ScrollProgressBar>
        <InfoCard icon={Clock} title="Check-in Time" delay={0.15}>
          <p className="font-semibold text-foreground">3:00 PM</p>
          <p className="mt-1">
            Early check-in depends on availability. Tell me your arrival time and I'll check for you.
          </p>
        </InfoCard>

        <InfoCard icon={Key} title="How do I get the keys?" delay={0.2}>
          <p className="mt-1">This is a self check-in. You'll receive a door code on the day of arrival.</p>
        </InfoCard>

        <InfoCard icon={MapPin} title="What's the exact address?" delay={0}>
          <p>Example Street 12, 3rd Floor, Apartment 7, Berlin.</p>
        </InfoCard>

        <InfoCard icon={Train} title="How do I get there from the airport or train station?" delay={0.05}>
          <p>Public transport is the easiest option. I can share step-by-step directions if you'd like.</p>
        </InfoCard>

        <InfoCard icon={Moon} title="What if I arrive late at night?" delay={0.1}>
          <p>No problem — self check-in works 24/7.</p>
        </InfoCard>
      </ScrollProgressBar>

      <div className="pb-2"></div>
    </motion.div>
  );
}
