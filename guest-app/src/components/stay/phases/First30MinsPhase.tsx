import { motion } from "framer-motion";
import { Wifi, Thermometer, HelpCircle, Home, Router, Droplets } from "lucide-react";
import { InfoCard } from "@/components/ui/InfoCard";
import { ScrollProgressBar } from "@/components/stay/ScrollProgressBar";

export function First30MinsPhase() {
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
          <Home className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          You're in!
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Take a breath and make yourself comfortable. Here's help with the most common things guests need when settling in.
        </p>
      </motion.div>

      <div className="pt-2"></div>

      <ScrollProgressBar>
        <InfoCard icon={Wifi} title="What's the Wi-Fi password?" delay={0}>
          <p>
            Network: <span className="font-semibold text-foreground">StayMate_WiFi</span>
          </p>
          <p>
            Password:{" "}
            <span className="font-mono font-semibold text-foreground bg-secondary px-1.5 py-0.5 rounded">
              welcome123
            </span>
          </p>
        </InfoCard>

        <InfoCard icon={Router} title="Where is the router?" delay={0.05}>
          <p>In the living room, behind the TV.</p>
        </InfoCard>

        <InfoCard icon={Thermometer} title="How do I turn on the heating or AC?" delay={0.1}>
          <p>Use the thermostat near the kitchen. Turn the dial clockwise to increase the temperature.</p>
        </InfoCard>

        <InfoCard icon={HelpCircle} title="Where are extra towels or blankets?" delay={0.15}>
          <p>In the bedroom wardrobe.</p>
        </InfoCard>

        <InfoCard icon={Droplets} title="Can I drink the tap water?" delay={0.2}>
          <p>Yes — tap water is safe to drink.</p>
        </InfoCard>
      </ScrollProgressBar>

      <div className="pb-2"></div>
    </motion.div>
  );
}