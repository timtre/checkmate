import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ConciergeAvatar } from "./ConciergeAvatar";
import { Check, CheckCheck } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  type: "guest" | "ai" | "system";
  timestamp?: string;
  showAvatar?: boolean;
  isLatest?: boolean;
}

export function ChatBubble({ message, type, timestamp, showAvatar = true, isLatest }: ChatBubbleProps) {
  const isGuest = type === "guest";
  const isSystem = type === "system";

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center my-4"
      >
        <div className="bg-chat-system text-chat-system-foreground text-xs font-medium px-4 py-2 rounded-full">
          {message}
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
        
        {timestamp && (
          <div
            className={cn(
              "flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground",
              isGuest ? "justify-end" : "justify-start"
            )}
          >
            <span>{timestamp}</span>
            {isGuest && (
              isLatest ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-primary" />
              )
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
