import { motion } from "framer-motion";
import { Heart, FileText, Star, RefreshCw, Search, Receipt, MessageSquare, CalendarHeart } from "lucide-react";
import { InfoCard } from "@/components/ui/InfoCard";
import { ScrollProgressBar } from "@/components/stay/ScrollProgressBar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface PostStayPhaseProps {
  propertyName: string;
}

export function PostStayPhase({ propertyName }: PostStayPhaseProps) {
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
        className="bg-gray-50 rounded-2xl p-6 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
          <Heart className="h-7 w-7 text-primary" />
        </div>
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">Thank you for staying!</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We hope you had a wonderful time at {propertyName}. Safe travels, and we hope to see you again soon!
        </p>
      </motion.div>

      <div className="pt-2"></div>

      <ScrollProgressBar>
        <InfoCard icon={FileText} title="Stay Summary" delay={0.05}>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium text-foreground">{propertyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dates</span>
              <span className="font-medium text-foreground">Jan 24 – 28, 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium text-foreground">4 nights</span>
            </div>
          </div>
        </InfoCard>

        <InfoCard icon={Search} title="I think I forgot something" delay={0.1}>
          <p>Let me know what you're missing and I'll check with the cleaning team.</p>
        </InfoCard>

        <InfoCard icon={Receipt} title="Can I get an invoice or receipt?" delay={0.15}>
          <p>Yes — I'll pass this request to the host.</p>
        </InfoCard>

        <InfoCard icon={MessageSquare} title="How do I leave a review?" delay={0.2}>
          <p>You'll receive a review prompt via the booking platform shortly after check-out.</p>
        </InfoCard>

        <InfoCard icon={Star} title="Share Your Experience" delay={0.3}>
          <p className="mb-3">Your feedback helps us improve and helps future guests.</p>
          <Link to="/feedback">
            <Button className="w-full rounded-xl">
              <Star className="h-4 w-4 mr-2" />
              Leave a Review
            </Button>
          </Link>
        </InfoCard>

        <InfoCard icon={RefreshCw} title="Book Again" delay={0.35}>
          <p className="mb-3">Loved your stay? Come back anytime!</p>
          <div className="space-y-2">
            <Button variant="outline" className="w-full rounded-xl">
              Browse available dates
            </Button>
          </div>
        </InfoCard>
      </ScrollProgressBar>

      <div className="pb-2"></div>
    </motion.div>
  );
}
