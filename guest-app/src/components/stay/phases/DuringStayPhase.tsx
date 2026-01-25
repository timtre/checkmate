import { motion } from "framer-motion";
import { Compass, WashingMachine, Coffee, Users, ShoppingCart, Utensils } from "lucide-react";
import { InfoCard } from "@/components/ui/InfoCard";
import { ScrollProgressBar } from "@/components/stay/ScrollProgressBar";

export function DuringStayPhase() {
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
          <Compass className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Enjoy your stay!
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          I'm here throughout your stay — whether it's a quick how-to, a local tip, or something that's not working as expected.
        </p>
      </motion.div>

      <div className="pt-2"></div>

      <ScrollProgressBar>
        <InfoCard icon={WashingMachine} title="How does the washing machine work?" delay={0}>
          <p>It's in the bathroom. Use program Eco 40–60. Detergent is under the sink.</p>
        </InfoCard>

        <InfoCard icon={Coffee} title="How do I use the coffee machine?" delay={0.05}>
          <p>Lift the top, insert a capsule, and press the button once for espresso.</p>
        </InfoCard>

        <InfoCard icon={Users} title="Is it okay to have guests over?" delay={0.1}>
          <p>Daytime visits are fine. Overnight guests aren't allowed without host approval.</p>
        </InfoCard>

        <InfoCard icon={ShoppingCart} title="Where can I buy groceries nearby?" delay={0.15}>
          <p>There's a supermarket about 3 minutes away on Main Street.</p>
        </InfoCard>

        <InfoCard icon={Utensils} title="Any restaurant recommendations?" delay={0.2}>
          <p>Yes — I can recommend nearby casual spots, vegetarian options, or late-night food. Just tell me what you're in the mood for.</p>
        </InfoCard>
      </ScrollProgressBar>

      <div className="pb-2"></div>
    </motion.div>
  );
}
