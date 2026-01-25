import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function EmergencyContact() {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Phone className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground mb-1">Emergency & Support</h3>
          <div className="text-muted-foreground text-sm leading-relaxed">
            <p>
              Property Manager: <span className="font-semibold text-foreground">Sarah</span>
            </p>
            <p className="text-foreground font-medium">+1 (310) 555-0123</p>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="mt-3 rounded-lg">
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Message support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
