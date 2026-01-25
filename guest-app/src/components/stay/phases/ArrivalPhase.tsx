import { motion } from "framer-motion";
import { DoorOpen, Sparkles, HelpCircle } from "lucide-react";
import { InfoCard } from "@/components/ui/InfoCard";
import { ScrollProgressBar } from "@/components/stay/ScrollProgressBar";

export function ArrivalPhase() {
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
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Welcome — you're almost in!
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          If anything feels unclear while entering the building, I'm right here to help. No question is too small.
        </p>
      </motion.div>

      <div className="pt-2"></div>

      <ScrollProgressBar>
        <InfoCard icon={DoorOpen} title="I'm here — how do I get inside?" delay={0}>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary font-semibold mt-0.5">1.</span>
              <span>Enter the building using code <span className="font-mono font-semibold text-foreground bg-secondary px-1.5 py-0.5 rounded">1234</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-semibold mt-0.5">2.</span>
              <span>Go to the 3rd floor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-semibold mt-0.5">3.</span>
              <span>Apartment #7 — enter your personal door code</span>
            </li>
          </ul>
        </InfoCard>

        <InfoCard icon={HelpCircle} title="The door code isn't working" delay={0.05}>
          <p>Please try entering it slowly and pressing "✓" at the end.</p>
          <p className="mt-2">If it still doesn't work, I'll contact the host immediately.</p>
        </InfoCard>

        <InfoCard icon={HelpCircle} title="Which apartment is it?" delay={0.1}>
          <p>Apartment #7, with a black door and silver handle.</p>
        </InfoCard>

        <InfoCard icon={HelpCircle} title="Am I at the right building?" delay={0.15}>
          <p>Yes — you should see building number 12 above the entrance door.</p>
        </InfoCard>
      </ScrollProgressBar>

      <div className="pb-2"></div>
    </motion.div>
  );
}
