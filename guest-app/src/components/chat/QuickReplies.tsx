import { motion } from "framer-motion";

interface QuickReply {
  id: string;
  label: string;
}

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex flex-wrap gap-2 mt-4 mb-2"
    >
      {replies.map((reply, index) => (
        <motion.button
          key={reply.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.1 * index }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(reply)}
          className="px-4 py-2.5 bg-card border border-border rounded-full text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all shadow-soft"
        >
          {reply.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
