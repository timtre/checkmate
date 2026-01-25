import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ConciergeAvatar } from "./ConciergeAvatar";
import { Check, CheckCheck } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ChatBubbleProps {
  message: string;
  type: "guest" | "ai" | "system";
  timestamp?: string;
  showAvatar?: boolean;
  isLatest?: boolean;
  escalated?: boolean;
}

export function ChatBubble({ message, type, timestamp, showAvatar = true, isLatest, escalated }: ChatBubbleProps) {
  const isGuest = type === "guest";
  const isSystem = type === "system";

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="flex w-full mb-4 gap-3 justify-start"
      >
        {showAvatar && <ConciergeAvatar size="sm" />}

        <div className={cn("max-w-[75%] relative", !showAvatar && "ml-11")}>
          <span className="text-[11px] font-semibold text-blue-600 mb-0.5 pl-1 block">
            Property Manager
          </span>
          <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-blue-50 text-foreground shadow-soft border border-blue-100">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message}</p>
          </div>

          {timestamp && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground justify-start">
              <span>{timestamp}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "flex w-full mb-4 gap-3",
        isGuest ? "justify-end" : "justify-start"
      )}
    >
      {!isGuest && showAvatar && (
        <ConciergeAvatar size="sm" />
      )}
      
      <div className={cn("max-w-[75%] relative", !isGuest && !showAvatar && "ml-11")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl",
            isGuest
              ? "bg-chat-guest text-chat-guest-foreground rounded-br-md shadow-medium"
              : "bg-chat-ai text-chat-ai-foreground rounded-bl-md shadow-soft border border-border/50"
          )}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        
        {(timestamp || (!isGuest && escalated)) && (
          <div
            className={cn(
              "flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground",
              isGuest ? "justify-end" : "justify-start"
            )}
          >
            {timestamp && <span>{timestamp}</span>}
            {isGuest && (
              isLatest ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-primary" />
              )
            )}
            {!isGuest && escalated && (
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 cursor-help">
                    Escalated
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>A property manager has been notified and will follow up shortly.</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
