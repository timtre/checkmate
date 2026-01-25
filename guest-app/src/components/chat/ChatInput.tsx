import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface EmojiData {
  native: string;
}

export function ChatInput({ onSend, placeholder = "Type a message...", disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleEmojiSelect = (emoji: EmojiData) => {
    setMessage((prev) => prev + emoji.native);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-3 bg-card/95 backdrop-blur-sm border-t border-border"
    >
      <div className="flex-1 flex items-center bg-secondary/40 rounded-full px-4 py-2 border border-border/50 focus-within:border-primary/30 focus-within:bg-secondary/60 transition-all">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-[15px] outline-none"
        />
        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-auto p-0 border-none shadow-lg"
            sideOffset={10}
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
              maxFrequentRows={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <motion.button
        type="submit"
        disabled={!message.trim() || disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex-shrink-0 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        <Send className="h-5 w-5" />
      </motion.button>
    </motion.form>
  );
}
